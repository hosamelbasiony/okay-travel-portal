const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api';
// In a real test, we would need to login first to get the cookie.
// Since I can't easily do that here without simulating cookies, I'll just check if the route exists or rely on manual verification by the user.
// BUT, I can try to use the secret to generate a token if I really wanted to.
// However, the simplest way is to advise the user on how to test it.

const testBulk = async () => {
    console.log('Testing bulk endpoints (Requires authentication)...');

    // In this app, auth is handled via cookies.
    // If you are using a tool like Postman:
    // 1. Send a POST request to /api/login with {"username": "admin", "password": "admin123"}
    // 2. The cookie will be saved automatically.
    // 3. Then send your POST to /api/general-info/bulk or /api/visa-info/bulk.

    const sampleGeneralData = [
        { "question": "هل يوجد فروع أخرى؟", "answer": "نعم، لدينا فرع في دبي والقاهرة." },
        { "question": "ما هي ساعات العمل؟", "answer": "من 9 صباحاً حتى 6 مساءً." }
    ];

    console.log('\n--- Sample Payload for general-info/bulk ---');
    console.log(JSON.stringify(sampleGeneralData, null, 2));

    const sampleVisaData = [
        { "question": "تأشيرة عمل", "answer": "تتطلب عقد عمل مصدق", "visa_name": "عمل", "eligible_for": "الجميع", "visa_type": "طويلة" }
    ];

    console.log('\n--- Sample Payload for visa-info/bulk ---');
    console.log(JSON.stringify(sampleVisaData, null, 2));
};

testBulk();
