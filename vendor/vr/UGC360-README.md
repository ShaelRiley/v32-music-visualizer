---
license: cc-by-4.0
tags:
- 360-degree
- video compression
- spherical video
- image sequence
- video
- pytorch-compatible
pretty_name: UGC360
size_categories:
- 10K<n<100K
configs:
  - config_name: UGC360-S
  - config_name: UGC360-M
  - config_name: UGC360-L
---

# UGC360

![Preview](./preview.jpg)

Dataset of 6866 9-frame 360-degree video sequences collected from 1321 unique videos from Vimeo and Youtube licensed under a Creative Commons License.
The dataset is split into three subsets UGC360-S, UGC360-M, and UGC360-L to ease data handling.

| Subset | Resolutions | Minimum | Maximum | Clips |
|----------|:-----------:|:---------:|:---------:|------:|
| [UGC360-S Part 1](https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/main/UGC360-S.z01?download=true), [UGC360-S Part 2](https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/main/UGC360-S.z02?download=true), [UGC360-S Part 3](https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/main/UGC360-S.z03?download=true), [UGC360-S Part 4](https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/main/UGC360-S.zip?download=true) | .5K - 2.5K | 640x320 | 2560x1440 | 5080 |
| [UGC360-M Part 1](https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/main/UGC360-M.z01?download=true), [UGC360-M Part 2](https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/main/UGC360-M.z02?download=true), [UGC360-M Part 3](https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/main/UGC360-M.zip?download=true) | 3K - 6K    | 3072x1536 | 5760x2880 | 1618 |
| [UGC360-L](https://huggingface.co/datasets/FAU-LMS/UGC360/resolve/main/UGC360-L.zip?download=true) | 8K         | 7680x3840 | 7680x4320 | 168  |

## Unpacking the dataset

Due to file size limitations on the Hugging Face platform, we had to upload the UGC360-S and UGC360-M subset archives as multipart zip files.
To unzip these multipart zips, download all multipart zip files (.z01, z02, ..., .zip) of a subset to the same folder.
From that folder, execute

```shell
zip -s- UGC360-S.zip -O UGC360-S-all.zip
unzip UGC360-S-all.zip
```

Replace 'UGC360-S' by 'UGC360-M' to do the same for the UGC360-M subset. The directory structure of the final dataset should then follow
```txt
.
├── UGC360-L
│   ├── ugc360-l.csv
│   ├── <video_id>/
│   │   ├── <clip_id>/
│   │   │   ├── 01.png
│   │   │   ├── 02.png
│   │   │   ├── 03.png
│   │   │   ├── ...
│   │   │   └── 09.png
│
├── UGC360-M
│   ├── ugc360-m.csv
│   ├── <video_id>/
│   │   ├── <clip_id>/
│   │   │   ├── 01.png
│   │   │   └── ...
│
└── UGC360-S
    ├── ugc360-s.csv
    ├── <video_id>/
    │   ├── <clip_id>/
    │   │   ├── 01.png
    │   │   └── ...

```

## License

The **UGC360 subset** is licensed under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**.

Each individual clip within the dataset originates from videos published under various **Creative Commons licenses** (e.g., CC-BY, CC-BY-SA). The corresponding license for each clip is documented in the CSV metadata files within each subset folder:

- `UGC360-S/ugc360-s.csv`
- `UGC360-M/ugc360-m.csv`
- `UGC360-L/ugc360-l.csv`

Each row contains a `license` column indicating the license of the source video.

### Attribution and Compliance

We collected only videos explicitly marked as Creative Commons on their original platforms (YouTube or Vimeo). For each clip, the dataset includes attribution information:

- Video ID
- Clip ID
- Publisher
- Original video URL
- License type
- Publication date

If you use this dataset, you are required to:

1. Comply with the CC license of each video
2. Attribute the dataset as a whole as:
   > UGC360 Dataset (CC BY-SA 4.0)

If you redistribute or modify this dataset, you must do so under the same license (CC BY-SA 4.0).

## Publication

If you use this dataset, please cite

```
@inproceedings{regensky2025nvc360,
  title     = {Beyond Perspective: Neural 360-Degree Video Compression},
  author    = {Andy Regensky and Marc Windsheimer and Fabian Brand and André Kaup},
  booktitle = {accepted for the IEEE/CVF International Conference on Computer Vision (ICCV)},
  year      = {2025}
}
```