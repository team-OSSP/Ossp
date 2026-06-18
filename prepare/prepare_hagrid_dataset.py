"""
HaGRIDv1 데이터셋 다운로드 + YOLO 포맷 변환 (zip 직접 파싱&로컬 실행용)

주의:
    - "three_gun" 직접 수집 필요 (이 zip엔 없음)
    - bbox: [top_left_x, top_left_y, width, height], 0~1 정규화
"""

import sys
import json
import random
import zipfile
import subprocess
from pathlib import Path
from collections import defaultdict

# ============================================================
# CONFIG
# ============================================================

TARGET_CLASSES = [
    "palm",
    "fist",
    "ok",
    "three",
    "like",
    "call",
    "rock",
    "three2",
    "three_gun",  # 없음 -> 스킵, 직접 수집 필요
]

MAX_IMAGES_PER_CLASS = 500
SPLIT_RATIO = {"train": 0.7, "val": 0.2, "test": 0.1}

REPO_ID = "cj-mills/hagrid-sample-30k-384p"
ZIP_FILENAME = "hagrid-sample-30k-384p.zip"
ZIP_ROOT = "hagrid-sample-30k-384p" 
IMG_PREFIX = "train_val_"  # 이미지 폴더명 접두사 

BASE_DIR = Path(__file__).resolve().parent
YOLO_DATA_DIR = BASE_DIR / "data" / "hagrid_yolo"
SEED = 42

# ============================================================


def install_deps():
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "huggingface_hub"],
        check=True,
    )


def get_zip_path() -> Path:
    from huggingface_hub import hf_hub_download

    print("[1/3] zip 파일 확인/다운로드...")
    zip_path = hf_hub_download(
        repo_id=REPO_ID,
        repo_type="dataset",
        filename=ZIP_FILENAME,
    )
    print(f"  경로: {zip_path}")
    return Path(zip_path)


def normalize_bbox_to_yolo(bbox):
    """[top_left_x, top_left_y, w, h] (0~1) -> [center_x, center_y, w, h] (0~1)"""
    x, y, w, h = bbox
    cx = x + w / 2
    cy = y + h / 2
    return cx, cy, w, h


def convert(zip_path: Path):
    print("[2/3] zip에서 직접 읽어 YOLO 포맷으로 변환 중...")
    random.seed(SEED)

    class_to_id = {cls: idx for idx, cls in enumerate(TARGET_CLASSES)}

    for split in SPLIT_RATIO:
        (YOLO_DATA_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (YOLO_DATA_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    counts = defaultdict(int)
    missing = []

    with zipfile.ZipFile(zip_path, "r") as zf:
        all_names = zf.namelist()

        for cls in TARGET_CLASSES:
            ann_path_in_zip = f"{ZIP_ROOT}/ann_train_val/{cls}.json"
            if ann_path_in_zip not in all_names:
                print(f"  [경고] 어노테이션 없음, 스킵: {cls}")
                missing.append(cls)
                continue

            with zf.open(ann_path_in_zip) as f:
                annotations = json.load(f)

            # 실제 zip 안에 존재하는 이미지 파일 목록을 먼저 구하고
            # 그 중에서 JSON에 어노테이션이 있는 것만 사용함
            img_dir_in_zip = f"{ZIP_ROOT}/hagrid_30k/{IMG_PREFIX}{cls}/"
            existing_image_ids = {
                Path(n).stem
                for n in all_names
                if n.startswith(img_dir_in_zip) and n.endswith(".jpg")
            }

            image_ids = [i for i in annotations.keys() if i in existing_image_ids]
            random.shuffle(image_ids)

            if MAX_IMAGES_PER_CLASS is not None:
                image_ids = image_ids[:MAX_IMAGES_PER_CLASS]

            print(f"  - {cls}: 실제 보유 이미지 {len(existing_image_ids)}장 중 "
                  f"어노테이션 매칭 {len(image_ids)}장 사용")

            n = len(image_ids)
            n_train = int(n * SPLIT_RATIO["train"])
            n_val = int(n * SPLIT_RATIO["val"])
            split_map = (
                [("train", i) for i in image_ids[:n_train]]
                + [("val", i) for i in image_ids[n_train:n_train + n_val]]
                + [("test", i) for i in image_ids[n_train + n_val:]]
            )

            for split, img_id in split_map:
                ann = annotations[img_id]
                img_path_in_zip = f"{img_dir_in_zip}{img_id}.jpg"

                if img_path_in_zip not in all_names:
                    continue

                dst_img = YOLO_DATA_DIR / "images" / split / f"{cls}_{img_id}.jpg"
                dst_label = YOLO_DATA_DIR / "labels" / split / f"{cls}_{img_id}.txt"

                # zip 안에서 이미지 바이트 그대로 추출하여 저장
                with zf.open(img_path_in_zip) as src, open(dst_img, "wb") as dst:
                    dst.write(src.read())

                lines = []
                for bbox, label in zip(ann["bboxes"], ann["labels"]):
                    if label not in class_to_id:
                        continue  # 타겟 외 라벨 제외
                    cx, cy, w, h = normalize_bbox_to_yolo(bbox)
                    class_id = class_to_id[label]
                    lines.append(f"{class_id} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}")

                with open(dst_label, "w", encoding="utf-8") as f:
                    f.write("\n".join(lines))

                counts[cls] += 1

    print("\n클래스별 최종 수집 개수:")
    for cls in TARGET_CLASSES:
        tag = "  [데이터셋에 없어 0장]" if cls in missing else ""
        print(f"  - {cls}: {counts.get(cls, 0)}장{tag}")

    return missing


def create_yaml():
    print("\n[3/3] dataset.yaml 생성")
    yaml_content = f"""path: {YOLO_DATA_DIR.resolve()}
train: images/train
val: images/val
test: images/test

names:
"""
    for idx, cls in enumerate(TARGET_CLASSES):
        yaml_content += f"  {idx}: {cls}\n"

    yaml_path = YOLO_DATA_DIR / "dataset.yaml"
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"  생성됨: {yaml_path}")
    return yaml_path


if __name__ == "__main__":
    install_deps()
    zip_path = get_zip_path()
    missing = convert(zip_path)
    yaml_path = create_yaml()

    print(f"\n완료. dataset.yaml 위치: {yaml_path}")
    if missing:
        print(f"\n[주의] 해당 클래스는 직접 수집 필요:")
        for m in missing:
            print(f"  - {m}")
