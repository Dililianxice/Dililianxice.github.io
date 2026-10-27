# Brain Bookmark · GitHub Pages 公开体验版

半成品演示：公开真实 EEG 回放、自动工作书签、编辑位置续做提示。

GitHub Pages 没有 Python 后端。本页播放 `demo-data.json` 中冻结 Python 模型的预计算结果，**不运行访问者的实时 EEG 推理**。触发时保存访问者当前的网页编辑内容，保存于当前浏览器，不上传到服务器。它不读取其他应用，也没有云端 LLM。

目标是「EEG 判断分心 → 自动保存进度 → 提醒从哪里继续」。**现实分心模型尚未完成。** 当前的 Gradient Boosting 仅区分闭眼休息、中等心算、困难心算；59.5% 是三类任务的测试平衡准确率，不是分心识别率。

算法：名义 512 Hz、质量检查、1–40 Hz 四阶因果带通；4 秒窗口 / 2 秒步长，Welch 频谱提取 13 项特征；按验证集选择梯度提升模型；3 次得分平均、连续 3 次满足规则、最高得分至少 0.5、冷却 15 秒。波形仅为显示抽取至 128 Hz，预计算算法仍使用 512 Hz 信号。坏信号暂停判定。

默认 `1909017_task3_row1231` 是工程联调样例：全程困难心算，模型约 20 秒出现一次类别变化。不是实际分心标注，不能用于估计分心检测性能。公开版的 EEG 和访问者文字不是同步的人体实验。页面不会把条件切换当成候选事件。

数据：Hamzah, Asadul Islam; Hasan, Md Zahid; Khondakar, Fazlul, *Single-Channel EEG Dataset for Task-Based Mental Workload Analysis*, v1, https://doi.org/10.17632/gy4sbnn389.1, CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ 。清洗节选、显示抽样、频谱与模型输出是本项目增加的处理，原作者不背书本项目。

再生成数据：在完整本地 Python 工程运行 `python scripts/export_web_demo.py`。

简短介绍：

Brain Bookmark 是一个 EEG × Personal Agent 黑客松半成品，目标是在检测到分心时，自动保存工作进度，并提醒从哪里继续。目前已打通真实脑电回放、自动工作书签和续做提示；解码采用 4 秒窗口的频谱特征与梯度提升分类器，当前区分的是闭眼休息和两档心算，尚不能可靠识别日常分心，真实硬件接入和个体校准也还在开发中。
