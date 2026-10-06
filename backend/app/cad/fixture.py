from app.schemas import Component, DesignSpec, Enclosure, Pose


def fixture(height=24, battery_height=10):
    return DesignSpec(
        components=[
            Component(
                part_id="controller",
                name="Synthetic controller",
                size_mm=(44, 24, 6),
                pose=Pose(translation_mm=(-22, 2, 4)),
                dimensions_confirmed=True,
                dimensions_source="synthetic_fixture",
                locked_fields=["pose"],
            ),
            Component(
                part_id="battery",
                name="Synthetic battery",
                size_mm=(40, 18, battery_height),
                pose=Pose(translation_mm=(-20, -24, 4)),
                dimensions_confirmed=True,
                dimensions_source="synthetic_fixture",
            ),
        ],
        enclosure=Enclosure(
            width_mm=88,
            depth_mm=62,
            height_mm=height,
            locked_fields=["width_mm", "depth_mm", "wall_mm", "base_mm", "lid_mm"],
        ),
    )
