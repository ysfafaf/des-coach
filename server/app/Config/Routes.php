<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

$routes->group('api/auth', ['namespace' => 'App\Controllers\Api'], function($routes){
    $routes->post('login',          'AuthController::login');
    $routes->post('logout',         'AuthController::logout');
    $routes->post('forget-password','AuthController::forgetPassword');
    $routes->post('reset-password', 'AuthController::resetPassword');
});

$routes->group('api', ['namespace' => 'App\Controllers\Api'], function($routes){

    // ── USERS (CRUD) ─────────────────────────────────────────────────────────
    $routes->resource('users', ['controller' => 'UserController']);

    // ── DASHBOARD ─────────────────────────────────────────────────────────────
    $routes->get('dashboard',        'DashboardController::index');
    $routes->post('dashboard/import','DashboardController::importExcel');

    // ── JADWAL (Scheduling) ───────────────────────────────────────────────────
    $routes->get('jadwal',              'JadwalController::index');
    $routes->post('jadwal',             'JadwalController::create');
    $routes->put('jadwal/(:num)',        'JadwalController::update/$1');
    $routes->delete('jadwal/(:num)',     'JadwalController::delete/$1');

    // ── COACHING SESSION ──────────────────────────────────────────────────────
    $routes->get('coaching/antrean',    'CoachingController::getAntrean');
    $routes->post('coaching/start',     'CoachingController::startCoaching');
    $routes->post('coaching/end',       'CoachingController::endCoaching');

    // ── FEEDBACK ──────────────────────────────────────────────────────────────
    $routes->post('feedback',               'FeedbackController::submitFeedback');   // Karyawan submit rating
    $routes->get('feedback/supervisi',      'FeedbackController::getSupervisiList'); // List rata-rata rating per coach
    $routes->get('feedback/comments',       'FeedbackController::getCommentsByCoach'); // Komentar per coach
    $routes->post('feedback/reply',         'FeedbackController::sendReply');        // HOD balas komentar

    // ── ADMIN ─────────────────────────────────────────────────────────────────
    $routes->post('admin/reset-database',   'AdminController::resetDatabase');  // Reset semua data sesi
    $routes->get('admin/categories',        'AdminController::getCategories');  // Master kategori topik
    $routes->get('admin/rooms',             'AdminController::getRooms');        // Master ruangan
});
?>