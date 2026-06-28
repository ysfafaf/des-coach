<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

$routes->group('api', function ($routes) {
    // Auth
    $routes->post('login', 'AuthController::login');
    $routes->post('forgot-password', 'AuthController::forgotPassword');

    // Users
    $routes->get('users', 'UserController::index');
    $routes->post('users', 'UserController::create');
    $routes->put('users/(:segment)', 'UserController::update/$1');
    $routes->delete('users/(:segment)', 'UserController::delete/$1');

    // Coaching Sessions
    $routes->get('coaching', 'CoachingController::index');
    $routes->post('coaching', 'CoachingController::create');
    $routes->put('coaching/(:segment)', 'CoachingController::update/$1');
    $routes->put('coaching/(:segment)/start', 'CoachingController::start/$1');
    $routes->put('coaching/(:segment)/end', 'CoachingController::end/$1');

    // Dashboard
    $routes->get('dashboard/stats', 'DashboardController::stats');
    $routes->get('dashboard/export', 'DashboardController::export');

    // Feedback
    $routes->get('feedback', 'FeedbackController::index');
    $routes->post('feedback/(:segment)/reply', 'FeedbackController::reply/$1');
});
