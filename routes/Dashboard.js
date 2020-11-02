const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const User = require('../models/User');
const userNotification = require('../models/userNotification');
const Resident = require('../models/Resident');
const residentNotification = require('../models/residentNotification');
const moment = require('moment');
router.get('/', ensureAuthenticated, async (req, res, next) => {
    try {
        const admins = await Admin.find({});
        const users_count = await User.count();
        const residents_count = await Resident.count();
        res.render('Dashboard/index', { page: 'Dashboard', admins: admins, title: 'good', layout: 'layout', admins_count: admins.length, users_count: users_count, residents_count:  residents_count  });
    } catch (err) {
        req.flash('error', 'حدث خطأ ما بالسيرفر');
        res.redirect('/dashboard');
    }
});

router.get('/settings', ensureAuthenticated, async (req, res, next) => {
    try {
        const admin = await Admin.findOne({ _id: req.user.id });
        res.render('Dashboard/form-elements', { admin: admin });
    } catch (err) {
        req.flash('error', 'حدث خطأ ما بالسيرفر');
        res.redirect('/dashboard');
    }
});

router.post('/settings/editInfo', ensureAuthenticated, async (req, res, next) => {
    try {
        const { fullname, email } = req.body;

        if (fullname.length < 6) {
            req.flash('error', 'الاسم يجب أن يكون أكثر من 6 أحرف');
            return res.redirect(`/dashboard/settings`);
        }
        if (!(/^\w+([-+.]\w+)*@((yahoo|gmail)\.com)$/.test(email))) {
            req.flash('error', 'البريد الإلكتروني يجب أن يكون جميل أو ياهو');
            return res.redirect(`/dashboard/settings`);
        }
        const admin = await Admin.findOne({ _id: req.user.id });
        if (admin.email === email) {
            await Admin.findByIdAndUpdate({ _id: req.user.id }, { fullname: fullname });
            req.flash('success', 'تم تعديل البيانات بنجاح');
            res.redirect(`/dashboard/settings`);
        } else {
            const emailFounded = await Admin.findOne({ email: email });
            if (emailFounded) {
                req.flash('error', 'هذا الحساب موجود مُسبقًا');
                res.redirect(`/dashboard/settings`);
            } else {
                await Admin.findByIdAndUpdate({ _id: req.user.id }, { fullname: fullname, email: email });
                req.flash('success', 'تم تعديل البيانات بنجاح');
                res.redirect(`/dashboard/settings`);
            }
        }
    } catch (err) {
        req.flash('error', 'حدث خطأ ما بالسيرفر');
        res.redirect('/dashboard');
    }
});

router.post('/settings/changePassword', ensureAuthenticated, async (req, res, next) => {
    try {
        const { password, confirmPassword } = req.body;


        if (password.length < 6) {
            req.flash('error', 'كلمة المرور يجب أن تكون أكثر من 6 أحرف');
            return res.redirect(`/dashboard/settings`);
        }

        if (password.length !== confirmPassword.length) {
            req.flash('error', 'كلمتا المرور غير متطابقين');
            return res.redirect(`/dashboard/settings`);
        }

        await Admin.findOneAndUpdate({ _id: req.user._id }, { password: await bcrypt.hash(password, 10) });
        req.flash('success', 'تم تغيير كلمة السر بنجاح');
        return res.redirect(`/dashboard/settings`);

    } catch (err) {
        req.flash('error', 'حدث خطأ ما في السيرفر');
        res.redirect(`/dashboard/settings`);
    }
});


router.post('/settings/deleteAccount', ensureAuthenticated, async (req, res, next) => {
    try {
        await Admin.findByIdAndDelete({ _id: req.user._id });
        req.flash('success', 'تم حذف الحساب بشكل ناجح');
        return res.redirect(`/auth/login`);
    } catch (err) {
        req.flash('error', 'حدث خطأ ما في السيرفر');
        res.redirect(`/dashboard/settings`);
    }
})

router.get('/accounts', ensureAuthenticated, async (req, res) => {
    try {
        const users = await User.find({ });
        res.render('Dashboard/contacts-grid', { users: users });
    } catch (err) {
        req.flash('error', 'حدث خطأ ما بالسيرفر');
        res.redirect('/dashboard');
    }
})

router.get('/residents', ensureAuthenticated, async (req, res) => {
    try {
        const residents = await Resident.find({ }).sort({ date: 'desc' }).populate('userID');
        res.render('Dashboard/residents', { residents: residents });
    } catch (err) {
        req.flash('error', 'حدث خطأ ما بالسيرفر');
        res.redirect('/dashboard');
    }
})

router.get('/notifications/users', ensureAuthenticated, async (req, res) => {
    try {
        const notifications = await userNotification.find({ }).populate('userID')
        res.render('Dashboard/userNotifications', { notifications: notifications, moment: moment });
    } catch (err) {
        req.flash('error', 'حدث خطأ ما بالسيرفر');
        res.redirect('/dashboard');
    }
})

router.get('/notifications/residents', ensureAuthenticated, async (req, res) => {
    try {
        const notifications = await residentNotification.find({ }).populate('userID')
        res.render('Dashboard/residentNotifications', { notifications: notifications, moment: moment });
    } catch (err) {
        req.flash('error', 'حدث خطأ ما بالسيرفر');
        res.redirect('/dashboard');
    }
})

router.get('/resident/:residentID', ensureAuthenticated, async (req, res) => {
    try {
        const residentID = req.params.residentID;
        if (!residentID.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash('error', 'رقم الطلب هذا غير صالح');
            return res.redirect('/dashboard');
          }
        var resident = await Resident.findOne({ _id: residentID });
        if (!resident) {
            req.flash('error', 'هذا الطلب غير موجود');
            return res.redirect('/dashboard');
        }
        resident = await Resident.findOne({ _id: residentID }).populate('userID');
        res.render('Dashboard/Request', { resident: resident, moment: moment });
    } catch (err) {
        console.log(err.message);
        req.flash('error', 'حدث خطأ ما بالسيرفر');
        res.redirect('/dashboard');
    }
})


module.exports = router;
