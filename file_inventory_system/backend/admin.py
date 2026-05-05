from django.db import models


class Station(models.Model):
    station_name = models.CharField(max_length=100)
    station_index = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.station_index} {self.station_name}"


class FileRecord(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE)
    file = models.FileField(upload_to='files/')
    date = models.DateField()
    file_type = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.station} - {self.date}"