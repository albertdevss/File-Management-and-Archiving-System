# File-Management-and-Archiving-System
A professional web-based application designed to manage, track, and organize inventory records. This system features a powerful Python (Django) backend, automated PDF report generation and dashboard data visualization.

# Tech Stack
* **Backend:** Python 3.13+, Django 4.2.29
* **Frontend:** HTML5, CSS3, JavaScript
* **Database:** SQLite (Development) / PostgreSQL (Production ready)
* **Libraries:** * `psycopg2-binary` (Database adapter)
    * `reportlab` (PDF generation)
    * `pillow` (Image processing)

## Installation
1. Get the Project
   Clone: use git clone https://github.com/albertdevss/File-Management-and-Archiving-System.git
2. Create a Virtual Environment
   Open your terminal (CMD for Windows, or Terminal for Linux) and navigate inside the file_inventory_system folder. Run the following command:

   For Windows type:

    python -m venv venv

   For Linux type:

   python3 -m venv venv

3. Run the venv folder using:

   For windows:

   venv/bin/activate

   For Linux:

   source venv/bin/activate

4. Install Requirements

      pip install -r requirements.txt

5. Create an admin account
   
   inside of venv type to create an admin account:

   python manage.py createsuperuser
   
7. Run the System
     Launch the backend server with this command:

   python manage.py runserver
8. Access the Website

   Once the server starts, open your web browser and go to:

   http://127.0.0.1:8000/
      
