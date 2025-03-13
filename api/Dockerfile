# Use an official PHP image with Apache
FROM php:8.2-apache

# Enable required PHP extensions
RUN apt update && apt install -y \
    libicu-dev \
    libzip-dev \
    libicu-dev zip unzip \
    && docker-php-ext-install mysqli intl zip pdo pdo_mysql \
    && docker-php-ext-enable mysqli

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

# Copy custom Apache configuration
COPY docker/000-default.conf /etc/apache2/sites-available/000-default.conf
RUN a2ensite 000-default.conf && service apache2 restart