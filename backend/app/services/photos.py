import hashlib
import io
from PIL import Image, ImageOps, UnidentifiedImageError
from app.errors import DomainError
from app.store import uid, now

Image.MAX_IMAGE_PIXELS = 40_000_000


class Photos:
    def __init__(self, store, artifacts, settings):
        self.store, self.artifacts, self.settings = store, artifacts, settings

    def upload(self, project_id, data, content_type):
        self.store.get("project", project_id)
        if len(data) > self.settings.max_upload_bytes:
            raise DomainError("upload_too_large", "Photo exceeds upload byte limit", 413)
        if content_type not in ("image/jpeg", "image/png", "image/webp"):
            raise DomainError("unsupported_image", "Use JPEG, PNG or WebP", 415)
        try:
            with Image.open(io.BytesIO(data)) as original:
                source_size = original.size
                orientation = original.getexif().get(274, 1)
                normalized = ImageOps.exif_transpose(original).convert("RGB")
                normalized.thumbnail((2400, 2400))
                stream = io.BytesIO()
                normalized.save(stream, format="JPEG", quality=92)
                size = normalized.size
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
            raise DomainError("invalid_image", "Unreadable or oversized image", 422)
        artifact = self.artifacts.save_bytes(
            stream.getvalue(),
            "photo.jpg",
            role="normalized_photo",
            mime_type="image/jpeg",
            project_id=project_id,
        )
        p = dict(
            id=uid("photo"),
            project_id=project_id,
            artifact=artifact,
            width=size[0],
            height=size[1],
            source_width=source_size[0],
            source_height=source_size[1],
            source_orientation=orientation,
            source_sha256=hashlib.sha256(data).hexdigest(),
            normalized_sha256=artifact["sha256"],
            created_at=now(),
            crop_coordinates="normalized image [0,1], after EXIF orientation",
        )
        with self.store.transaction():
            self.store.put("photo", p)
        return p

    def images(self, project_id, photo_ids, part_id=None):
        from app.schemas import Crop

        p = self.store.get("project", project_id)
        c = next((c for c in p["components"] if c["part_id"] == part_id), None)
        result = []
        for key in photo_ids:
            photo = self.store.get("photo", key)
            if photo["project_id"] != project_id:
                raise DomainError("invalid_reference", "Photo belongs to a different project", 422)
            _, path = self.artifacts.path(photo["artifact"]["id"])
            data = path.read_bytes()
            if c and c.get("crop") and c["crop"]["photo_id"] == key:
                crop = Crop.model_validate(c["crop"])
                with Image.open(io.BytesIO(data)) as im:
                    x0, y0, x1, y1 = crop.box_xyxy
                    im = im.crop(
                        (
                            int(x0 * im.width),
                            int(y0 * im.height),
                            max(int(x1 * im.width), int(x0 * im.width) + 1),
                            max(int(y1 * im.height), int(y0 * im.height) + 1),
                        )
                    )
                    out = io.BytesIO()
                    im.save(out, format="JPEG")
                    data = out.getvalue()
            result.append(data)
        return result
