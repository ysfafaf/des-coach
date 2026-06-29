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

    $routes->get('jadwal', 'JadwalController::index');          
    $routes->post('jadwal', 'JadwalController::create');            
    $routes->put('jadwal/(:num)', 'JadwalController::update/$1');   
    $routes->delete('jadwal/(:num)', 'JadwalController::delete/$1'); 

    $routes->get('coaching/antrean', 'CoachingController::getAntrean'); 
    $routes->post('coaching/start', 'CoachingController::startCoaching'); 
    $routes->post('coaching/end', 'CoachingController::endCoaching');

    $routes->get('feedback/supervisi', 'FeedbackController::getSupervisiList'); 
    $routes->get('feedback/comments', 'FeedbackController::getCommentsByCoach'); 
    $routes->post('feedback/reply', 'FeedbackController::sendReply');
});


?>