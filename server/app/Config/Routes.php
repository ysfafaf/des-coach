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
});


?>