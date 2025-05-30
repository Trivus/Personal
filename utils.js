function getGreeting() {
    const hours = new Date().getHours();
    if (hours < 12) return "صباح الخير!";
    if (hours < 18) return "مساء الخير!";
    return "ليلة سعيدة!";
}

function isToday(timestamp) {
    const today = new Date();
    const date = new Date(timestamp);
    return today.toDateString() === date.toDateString();
}