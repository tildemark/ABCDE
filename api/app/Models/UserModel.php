<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table      = 'users'; // Database table name
    protected $primaryKey = 'id';

    protected $allowedFields = ['username', 'email', 'password'];

    protected $useTimestamps = true; // Enables created_at and updated_at fields
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
