import os
import numpy as np
from PIL import Image
from moviepy.video.io.ImageSequenceClip import ImageSequenceClip

output_dir = 'docs/videos'
os.makedirs(output_dir, exist_ok=True)

images = [
    'docs/screenshots/desktop-view.png',
    'docs/screenshots/mobile-view.png'
]

frames = []
for img_path in images:
    img = Image.open(img_path).convert('RGB')
    frames.append(np.array(img))

max_width = max(frame.shape[1] for frame in frames)
max_height = max(frame.shape[0] for frame in frames)

normalized_frames = []
for frame in frames:
    img = Image.fromarray(frame)
    img = img.resize((max_width, max_height), Image.LANCZOS)
    normalized_frames.append(np.array(img))

output_path = os.path.join(output_dir, 'demo-video.mp4')
clip = ImageSequenceClip(normalized_frames, fps=1)
clip = clip.with_duration(8)
clip.write_videofile(output_path, fps=24)
print('Demo video created at', output_path)
