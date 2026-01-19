const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = '$2b$10$V3h6NJWrn7M9/JONZbW7aOd0tyw79mt6Fb3Qhc1egxmVWovAvVPMC';

bcrypt.compare(password, hash).then(match => {
    console.log('Match:', match);
}).catch(err => {
    console.error(err);
});
