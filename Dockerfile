# Use an official PHP image with Apache
FROM php:8.2-apache

# Enable required PHP extensions
RUN apt update && apt install -y \
    libicu-dev \
    libzip-dev \
    libicu-dev zip unzip \
    && docker-php-ext-install intl zip pdo pdo_mysql

# Enable Apache mod_rewrite (required for CodeIgniter)
RUN a2enmod rewrite

# Set the working directory inside the container
WORKDIR /var/www/html

# Copy project files to the container
COPY . /var/www/html

# Set permissions for storage and writable folders
RUN chown -R www-data:www-data /var/www/html/writable /var/www/html/public

# Expose port 80
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]