#!/usr/bin/env python3

import basilisk
import disks
import machfs
import os.path
import paths
import stickies
import tempfile

if __name__ == "__main__":
    v = machfs.Volume()
    v.name = "Stickies Placeholder"

    stickies_file = machfs.File()
    stickies_file.data = stickies.generate_placeholder()
    stickies_file.type = b"notz"
    stickies_file.creator = b"notz"
    v["Stickies file"] = stickies_file

    ttxt_file = machfs.File()
    ttxt_file.data = stickies.generate_ttxt_placeholder()
    ttxt_file.type = b"TEXT"
    ttxt_file.creator = b"ttxt"
    v["Welcome!"] = ttxt_file

    image = v.write(
        size=1440 * 1024,  # HD floppy
        align=512,
        desktopdb=True)

    with tempfile.TemporaryDirectory() as temp_dir:
        output_path = os.path.join(temp_dir, "Stickies.dsk")
        with open(output_path, "wb") as f:
            f.write(image)

        print("Wrote Stickies to disk image %s" % output_path)

        # Booth with Speed Disk so that disks can be de-fragmented after the
        # placeholder file is copied onto them -- that ensures that it's written
        # as a contiguous chunk.
        speed_disk_path = os.path.join(paths.IMAGES_DIR,
                                       "Speed Disk 3.1.3.dsk")

        system_disks = disks.ALL_DISKS
        filter = os.getenv("DEBUG_SYSTEM_FILTER")
        if filter:
            system_disks = [d for d in system_disks if filter in d.name]

        print(
            "Starting Basilisk II with %d disk images, copy 'Stickies file' to "
            "the Preferences folder" % len(system_disks))
        # Speed Disk disk image is bootable, but Basilisk II needs to be told to
        # emulate a IIci.
        basilisk.run(["*" + speed_disk_path] +
                     [d.path() for d in system_disks] + [output_path],
                     modelid=5)
