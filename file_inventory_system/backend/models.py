from django.db import models
import os
from django.utils import timezone
from datetime import timedelta


# ================= HISTORY LOG =================
class HistoryLog(models.Model):
    ACTIONS = [
        ("UPLOAD", "Upload"),
        ("EDIT", "Edit"),
        ("DELETE", "Delete"),
        ("GENERATE", "Generate"),
    ]

    STATUS_CHOICES = [
        ("PROCESSING", "Processing"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    ]

    process_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    action = models.CharField(max_length=10, choices=ACTIONS)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="COMPLETED")

    station_name = models.CharField(max_length=100, default="All Stations")
    station_index = models.CharField(max_length=20, default="-")

    file_name = models.CharField(max_length=200, null=True, blank=True)
    date = models.CharField(max_length=20, null=True, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.process_id or 'NO-ID'} | {self.action} | {self.status}"


def upload_file_path(instance, filename):
    import re
    import os

    # remove extension for parsing
    name = filename.rsplit(".", 1)[0]

    match = re.match(r"(\d+)[-_](\d{6,8})$", name)

    # ? If filename is invalid, DO NOT STORE FILE
    if not match:
        return ""

    station_index = match.group(1)
    date_raw = match.group(2)
    year = date_raw[:4]

    ext = filename.split('.')[-1].lower()

    # ================= IMAGE (RR-CHART / SYNOP) =================
    if len(date_raw) == 8 and ext in ["jpg", "jpeg", "png", "jfif"]:
        return os.path.join("rr-chart", "synop", year, filename)

    # ================= PDF (6-HOURLY / SYNOP) =================
    if len(date_raw) == 6 and ext == "pdf":
        return os.path.join("6hrly", "synop", year, filename)

    # ? INVALID ? DO NOT STORE
    return ""

# ================= INVENTORY FILE =================
class InventoryFile(models.Model):

    FILE_TYPES = [
        ("PDF", "6H Daily Report"),
        ("IMG", "Rainfall Image"),
    ]

    station_name = models.CharField(max_length=100)
    station_index = models.CharField(max_length=20)

    file = models.FileField(upload_to=upload_file_path)

    date = models.CharField(max_length=20)
    file_type = models.CharField(max_length=10, choices=FILE_TYPES)

    created_at = models.DateTimeField(auto_now_add=True)

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("station_index", "date", "file_type")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.station_index} | {self.file_type} | {self.date}"


# ================= ACTIVITY LOG =================
class ActivityLog(models.Model):
    station_name = models.CharField(max_length=100)
    file_name = models.CharField(max_length=200)
    action = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.station_name} - {self.action}"


class PasswordResetOTP(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=3)

    def __str__(self):
        return f"{self.email} - {self.code}"