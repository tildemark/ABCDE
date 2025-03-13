# CodeIgniter 4 API with JWT Authentication (Dockerized)

This project is a CodeIgniter 4 (CI4) API with JWT authentication, built using Docker for a consistent development environment. It uses MySQL for database storage and Composer for dependency management.

## Prerequisites

* Docker Desktop (Windows)
* Git

## Setup

1.  **Clone the Repository:**

    ```bash
    git clone <your_repository_url>
    cd <your_project_directory>
    ```

2.  **Configure Database and JWT:**

    * Create a `.env` file in the project root by copying the `env` file:
        ```bash
        copy env .env
        ```
    * Modify the `.env` file with your MySQL database credentials and a strong JWT secret:

        ```ini
        database.default.hostname = db
        database.default.database = api_db
        database.default.username = root # or your mysql username
        database.default.password = your_mysql_root_password # or your mysql password
        JWT_SECRET = your_very_strong_secret_key
        ```
    * Also copy .env to .env.testing.
        ```bash
        copy .env .env.testing
        ```

3.  **Start Docker Containers:**

    ```bash
    docker-compose up -d --build
    ```

4.  **Run Migrations:**

    * Access the running `app` container:

        ```bash
        docker exec -it <your_project_name>-app-1 bash
        ```

    * Run the migrations:

        ```bash
        php spark migrate
        ```

    * Exit the container:

        ```bash
        exit
        ```

5.  **Access the API:**

    * Open your web browser and go to `http://localhost:8080`.

## API Endpoints

* **Register:** `POST /register` (Requires: username, password, email)
* **Login:** `POST /login` (Requires: username, password)
* **Profile:** `GET /profile` (Requires: Authorization header with JWT token)

## Docker Configuration

* **`docker-compose.yml`:** Defines the services (app, db), volumes, and environment variables.
* **`Dockerfile`:** Builds the application container with PHP, Apache, and necessary extensions.
* **`docker/apache2/vhost.conf`:** Custom Apache virtual host configuration to serve the `public` directory.

## Troubleshooting

* **403 Forbidden:** Ensure that the `public` directory is correctly configured as the `DocumentRoot` in `docker/apache2/vhost.conf`.
* **Composer Install Errors:** Verify that all required PHP extensions (mysqli, pdo\_mysql, zip, intl) and ICU libraries (libicu-dev) are installed in the `Dockerfile`.
* **Database Connection Errors:** Double-check your database credentials in the `.env` file and `docker-compose.yml`.
* **Migration Errors:** Ensure the mysql container is up and running before trying to run the migrations.

## Contributing

Feel free to contribute by submitting pull requests or reporting issues.

## License

[Your License (e.g., MIT)]