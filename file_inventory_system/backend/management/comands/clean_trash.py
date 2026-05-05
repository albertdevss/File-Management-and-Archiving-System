from django.core.management.base import BaseCommand
from datetime import timedelta
from django.utils import timezone
from inventory.models import InventoryFile

class Command(BaseCommand):
    help = "Delete files in trash older than 60 days"

    def handle(self, *args, **kwargs):
        limit = timezone.now() - timedelta(days=60)

        old_files = InventoryFile.objects.filter(
            is_deleted=True,
            deleted_at__lt=limit
        )

        count = 0

        for file in old_files:
            if file.file:
                file.file.delete(save=False)
            file.delete()
            count += 1

        self.stdout.write(self.style.SUCCESS(f"Deleted {count} old files"))