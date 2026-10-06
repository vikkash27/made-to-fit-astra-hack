import numpy as np
from app.schemas import Pose

C = np.array([[1.0, 0, 0], [0, 0, 1.0], [0, -1.0, 0]])


def rotation(q):
    x, y, z, w = q
    return np.array(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ]
    )


def render_points(points):
    return (np.asarray(points) @ C.T) / 1000


def render_transform(pose: Pose):
    out = np.eye(4)
    out[:3, :3] = C @ rotation(pose.rotation_quaternion_xyzw) @ C.T
    out[:3, 3] = render_points(pose.translation_mm)
    return out


def cad_transform(pose: Pose):
    out = np.eye(4)
    out[:3, :3] = rotation(pose.rotation_quaternion_xyzw)
    out[:3, 3] = pose.translation_mm
    return out
