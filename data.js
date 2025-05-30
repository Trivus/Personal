let data = getInitialData();

function getInitialData() {
    return {
        tasks: [],
        goals: [],
        xp: 0,
        todayXP: 0,
        daysActive: 1,
        badges: [],
        lastSaved: null
    };
}

function loadData() {
    const saved = localStorage.getItem('personalDataAssistant');
    if (saved) {
        data = JSON.parse(saved);
        data.goals = data.goals.map(goal => ({
            id: goal.id,
            title: goal.title,
            date: goal.date,
            priority: goal.priority || 'medium',
            subtasks: goal.subtasks.map(s => ({
                text: s.text,
                notes: s.notes || '',
                completed: !!s.completed
            })),
            completed: !!goal.completed
        }));
        const lastSaved = new Date(data.lastSaved || Date.now());
        const today = new Date();
        if (lastSaved.toISOString().split('T')[0] !== today.toISOString().split('T')[0]) {
            data.todayXP = 0;
            data.daysActive = (data.daysActive || 1) + 1;
        }
        data.lastSaved = today.toISOString();
    }
}

function saveData() {
    data.lastSaved = new Date().toISOString();
    localStorage.setItem('personalDataAssistant', JSON.stringify(data));
}