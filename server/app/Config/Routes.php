<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

$routes->group('api/auth', ['namespace' => 'App\Controllers\Api'], function($routes){
    $routes->post('login', 'AuthController::login');
    $routes->post('logout', 'AuthController::logout');
    $routes->post('forget-password', 'AuthController::forgetPassword');
    $routes->post('reset-password', 'AuthController::resetPassword');
});

$routes->group('api', ['namespace' => 'App\Controllers\Api'], function($routes){
    $routes->resource('users', ['controller' => 'UserController']);
    $routes->get('dashboard', 'DashboardController::index');
    $routes->post('dashboard/import', 'DashboardController::importExcel');

    $routes->get('jadwal', 'JadwalController::index');              // Lihat jadwal bulanan (GET)
    $routes->post('jadwal', 'JadwalController::create');            // Tambah jadwal baru (POST)
    $routes->put('jadwal/(:num)', 'JadwalController::update/$1');   // Edit/Update jadwal berdasarkan ID (PUT)
    $routes->delete('jadwal/(:num)', 'JadwalController::delete/$1'); // Hapus jadwal berdasarkan ID (DELETE)
});


?>