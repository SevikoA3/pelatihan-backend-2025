import express from 'express';
const router = express.Router();

import users from './users.js';

router.get('/users', (req, res, next) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'Successfully get all users',
            data: users
        });
    }
    catch (error) {
        console.log(error.message);    
    }
});

router.get('/users/:id', (req, res, next) => {
    try {
        const {id} = req.params;

        const user = users.find((user) => user.id == id);

        if (!user) {
            res.status(400).json({
                status: 'error',
                message: `User with id ${id} not found`
            });
        }
        else {
            res.status(200).json({
                status: 'success',
                message: 'succuessfully get user',
                user: user
            });
        }
    } catch (error) {
        console.log(error.message);
    }
});

router.post('/users', (req, res, next) => {
    try {
        const {name, division} = req.body;

        const sizeUser = users.length;

        const newUser = {
            id: sizeUser,
            nama: name,
            division: division
        };

        users.push(newUser);

        res.status(201).json({
            status: 'success',
            message: 'Successfully add new user',
            data: users
        });
    } catch (error) {
        console.log(error.message);
    }
})

router.delete('/users/:id', (req, res, next) => {
    try {
        const {id} = req.params;

        const targetedUser = users.findIndex((user) => user.id == id);

        if (targetedUser == -1) {
            res.status(400).json({
                status: 'error',
                message: `User with id ${id} not found`
            });
        }
        else {
            users.splice(targetedUser, 1);

            res.status(200).json({
                status: 'success',
                message: 'Successfully delete user',
                data: users
            });
        }
    } catch (error) {
        console.log(error.message);
    }
});

router.put('/users/:id', (req, res, next) => {
    try {
        const {id, name, division} = req.body;

        const targetedUser = users.findIndex((user) => user.id == id);

        if (targetedUser === -1) {
            res.status(400).json({
                status: 'error',
                message: `User with id ${id} not found`
            });
        }
        else {
            users[targetedUser] = {
                id: targetedUser,
                name: name,
                division: division 
            }

            res.status(200).json({
                status: 'success',
                message: 'Successfully update user',
                data: users
            });
        }
    } catch (error) {
        console.log(error.message);
    }
});

export default router;
