const router = require('express').Router();
const { isAuth, isAdmin } = require('../middlewares/auth');
const {getAppInfo, getMostRated} = require('../controllers/admin');


router.get('/app-info', isAuth, isAdmin, getAppInfo);
router.get('/most-rated', isAuth, isAdmin, getMostRated);



module.exports = router;