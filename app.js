document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDashboard();
    updateGoals('all');
    updateAchievements();

    document.getElementById('task-form').addEventListener('submit', addTask);
    document.getElementById('goal-form').addEventListener('submit', addGoal);

    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.dataset.section;
            if (sectionId) showSection(sectionId);
        });
    });
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => section.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(sectionId).classList.remove('hidden');
    document.querySelectorAll(`.nav-btn[data-section="${sectionId}"]`).forEach(btn => btn.classList.add('active'));
    if (window.innerWidth <= 1024) document.querySelector('.sidebar').classList.remove('active');
}

function showAddModal() {
    document.getElementById('add-modal').classList.remove('hidden');
    showTab('task-tab');
}

function closeAddModal() {
    document.getElementById('add-modal').classList.add('hidden');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById('task-form').reset();
    document.getElementById('goal-form').reset();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add('active');
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function isDueSoon(date) {
    const today = new Date();
    const dueDate = new Date(date);
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff <= 7 && daysDiff >= 0;
}

function updateDashboard() {
    document.getElementById('greeting').textContent = getGreeting();
    document.getElementById('xp-today').textContent = data.todayXP || 0;
    filterTasks('all');
    updateProgress();
    updateDashboardGoals('active');
    updateFocusToday();
}

function updateFocusToday() {
    const focusEl = document.getElementById('focus-today');
    const suggestionEl = document.getElementById('focus-suggestion');
    let suggestion = '';
    const highPriorityGoals = data.goals.filter(g => g.priority === 'high' && !g.completed);
    const dueSoonGoals = data.goals.filter(g => isDueSoon(g.date) && !g.completed);
    if (highPriorityGoals.length > 0) {
        const goal = highPriorityGoals[0];
        const incompleteSubtask = goal.subtasks.find(s => !s.completed);
        suggestion = incompleteSubtask 
            ? `اعمل على: "${incompleteSubtask.text}" من هدف "${goal.title}" (أولوية عالية)`
            : `ركز على إكمال هدف: "${goal.title}" (أولوية عالية)`;
    } else if (dueSoonGoals.length > 0) {
        const goal = dueSoonGoals[0];
        const incompleteSubtask = goal.subtasks.find(s => !s.completed);
        suggestion = incompleteSubtask 
            ? `اعمل على: "${incompleteSubtask.text}" من هدف "${goal.title}" (موعد قريب)`
            : `ركز على إكمال هدف: "${goal.title}" (موعد قريب)`;
    } else {
        const activeGoals = data.goals.filter(g => !g.completed);
        if (activeGoals.length > 0) {
            const goal = activeGoals[0];
            const incompleteSubtask = goal.subtasks.find(s => !s.completed);
            suggestion = incompleteSubtask 
                ? `اعمل على: "${incompleteSubtask.text}" من هدف "${goal.title}"`
                : `ركز على إكمال هدف: "${goal.title}"`;
        }
    }
    if (suggestion) {
        suggestionEl.textContent = suggestion;
        focusEl.classList.remove('hidden');
    } else {
        focusEl.classList.add('hidden');
    }
}

function addTask(e) {
    e.preventDefault();
    const task = {
        id: Date.now(),
        title: document.getElementById('task-title').value,
        desc: document.getElementById('task-desc').value,
        completed: false
    };
    data.tasks.push(task);
    saveData();
    filterTasks(document.getElementById('task-filter').value);
    updateProgress();
    showNotification('تم إضافة المهمة بنجاح!');
    closeAddModal();
}

function filterTasks(filter) {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';
    let filteredTasks = data.tasks.filter(t => isToday(t.id));
    if (filter !== 'all') {
        filteredTasks = filteredTasks.filter(t => filter === 'completed' ? t.completed : !t.completed);
    }
    filteredTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = 'task bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-blue-500';
        taskEl.innerHTML = `
            <h3 class="text-xl font-semibold text-gray-100 mb-2">${task.title}</h3>
            <p class="text-gray-400 mb-4">${task.desc || 'لا يوجد وصف'}</p>
            <div class="flex gap-4">
                <button onclick="toggleTask(${task.id})" class="bg-${task.completed ? 'green' : 'blue'}-600 hover:bg-${task.completed ? 'green' : 'blue'}-700 text-white px-4 py-2 rounded-lg transition">${task.completed ? 'إلغاء الإكمال' : 'إكمال'}</button>
                <button onclick="deleteTask(${task.id})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition" aria-label="حذف ${task.title}">حذف</button>
            </div>
        `;
        tasksList.appendChild(taskEl);
    });
}

function toggleTask(id) {
    const task = data.tasks.find(t => t.id === id);
    task.completed = !task.completed;
    if (task.completed) {
        data.xp += 10;
        data.todayXP = (data.todayXP || 0) + 10;
        showNotification('مبروك! تم إكمال المهمة (+10 XP)');
        checkAchievements();
    } else {
        data.xp = Math.max(0, data.xp - 10);
        data.todayXP = Math.max(0, (data.todayXP || 0) - 10);
    }
    saveData();
    updateProgress();
    filterTasks(document.getElementById('task-filter').value);
    updateDashboard();
    updateAchievements();
}

function deleteTask(id) {
    data.tasks = data.tasks.filter(t => t.id !== id);
    saveData();
    filterTasks(document.getElementById('task-filter').value);
    updateProgress();
    showNotification('تم حذف المهمة');
}

function updateProgress() {
    const todayTasks = data.tasks.filter(t => isToday(t.id));
    const completed = todayTasks.filter(t => t.completed).length;
    const progress = todayTasks.length ? (completed / todayTasks.length) * 100 : 0;
    document.getElementById('progress-text').textContent = `تقدم اليوم: ${Math.round(progress)}%`;
    document.getElementById('progress-bar-fill').style.width = `${progress}%`;
}

function updateDashboardGoals(filter) {
    const goalsList = document.getElementById('dashboard-goals');
    goalsList.innerHTML = '';
    let filteredGoals = data.goals;
    if (filter === 'active') {
        filteredGoals = data.goals.filter(g => !g.completed);
    } else if (filter === 'completed') {
        filteredGoals = data.goals.filter(g => g.completed);
    } else if (filter === 'due-soon') {
        filteredGoals = data.goals.filter(g => isDueSoon(g.date) && !g.completed);
    } else if (filter === 'high-priority') {
        filteredGoals = data.goals.filter(g => g.priority === 'high' && !g.completed);
    }
    filteredGoals.slice(0, 3).forEach(goal => {
        const completedSubtasks = goal.subtasks.filter(s => s.completed).length;
        const totalSubtasks = goal.subtasks.length;
        const progress = totalSubtasks ? (completedSubtasks / totalSubtasks) * 100 : 0;
        const subtaskXP = completedSubtasks * 10;
        const bonusXP = goal.completed ? totalSubtasks * 10 : 0;
        const totalXP = subtaskXP + bonusXP;
        const isDue = isDueSoon(goal.date);
        const priorityColor = goal.priority === 'high' ? 'text-yellow-400' : goal.priority === 'medium' ? 'text-blue-400' : 'text-gray-400';
        const goalEl = document.createElement('div');
        goalEl.className = `goal bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 ${isDue && !goal.completed ? 'border-red-500' : 'border-blue-500'}`;
        goalEl.innerHTML = `
            <h3 class="text-xl font-semibold text-gray-100 mb-2">${goal.title}</h3>
            <p class="text-gray-400">التاريخ: ${goal.date}${isDue && !goal.completed ? ' <span class="text-red-400">(موعد قريب!)</span>' : ''}</p>
            <p class="text-gray-400 ${priorityColor} mb-2">الأولوية: ${goal.priority === 'high' ? 'عالية' : goal.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</p>
            <p class="text-gray-400 mb-2">نقاط XP: ${totalXP}</p>
            <div class="goal-progress-bar mb-4">
                <span class="block text-sm text-gray-100 mb-1">التقدم: ${Math.round(progress)}%</span>
                <div class="bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div class="goal-progress-bar-fill h-full bg-blue-500 transition-all duration-500" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
        goalsList.appendChild(goalEl);
    });
}

function addGoal(e) {
    e.preventDefault();
    const subtasks = document.getElementById('goal-subtasks').value.split('\n').filter(s => s.trim()).map(s => ({
        text: s.trim(),
        notes: '',
        completed: false
    }));
    const goal = {
        id: Date.now(),
        title: document.getElementById('goal-title').value,
        date: document.getElementById('goal-date').value,
        priority: document.getElementById('goal-priority').value,
        subtasks: subtasks,
        completed: false
    };
    data.goals.push(goal);
    saveData();
    updateGoals(document.getElementById('goals-page-filter').value);
    updateDashboardGoals(document.getElementById('goal-filter').value);
    updateDashboard();
    showNotification('تم إضافة الهدف بنجاح!');
    closeAddModal();
}

function updateGoals(filter) {
    const goalsList = document.getElementById('goals-list');
    goalsList.innerHTML = '';
    let filteredGoals = data.goals;
    if (filter === 'active') {
        filteredGoals = data.goals.filter(g => !g.completed);
    } else if (filter === 'completed') {
        filteredGoals = data.goals.filter(g => g.completed);
    } else if (filter === 'due-soon') {
        filteredGoals = data.goals.filter(g => isDueSoon(g.date) && !g.completed);
    } else if (filter === 'high-priority') {
        filteredGoals = data.goals.filter(g => g.priority === 'high' && !g.completed);
    }
    filteredGoals.forEach(goal => {
        const completedSubtasks = goal.subtasks.filter(s => s.completed).length;
        const totalSubtasks = goal.subtasks.length;
        const progress = totalSubtasks ? (completedSubtasks / totalSubtasks) * 100 : 0;
        const subtaskXP = completedSubtasks * 10;
        const bonusXP = goal.completed ? totalSubtasks * 10 : 0;
        const totalXP = subtaskXP + bonusXP;
        const isDue = isDueSoon(goal.date);
        const priorityColor = goal.priority === 'high' ? 'text-yellow-400' : goal.priority === 'medium' ? 'text-blue-400' : 'text-gray-400';
        const goalEl = document.createElement('div');
        goalEl.className = `goal bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition border-l-4 ${isDue && !goal.completed ? 'border-red-500' : 'border-blue-500'}`;
        goalEl.innerHTML = `
            <h3 class="text-xl font-bold text-gray-100 mb-2">${goal.title}</h3>
            <p class="text-gray-400">التاريخ: ${goal.date}${isDue && !goal.completed ? ' <span class="text-red-400">(موعد قريب!)</span>' : ''}</p>
            <p class="text-gray-400 ${priorityColor} mb-1">الأولوية: ${goal.priority === 'high' ? 'عالية' : goal.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</p>
            <p class="text-lg mb-2">نقاط XP: ${totalXP} (${subtaskXP} من الدروس + ${bonusXP} مكافأة)</p>
            <div class="goal-progress-bar mb-4">
                <span class="block text-sm text-gray-100 mb-1">التقدم: ${Math.round(progress)}%</span>
                <div class="bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div class="goal-progress-bar-fill h-full bg-blue-500 transition-all duration-500" style="width: ${progress}%"></div>
                </div>
            </div>
            <h4 class="text-lg font-semibold text-gray-100 mb-2">الدروس:</h4>
            <ul class="subtasks mb-4">
                ${goal.subtasks.map(s => `
                    <li class="flex flex-col gap-2 py-2 border-b border-gray-700">
                        <div class="flex justify-between items-center">
                            <span class="${s.completed ? 'text-green-400 line-through' : 'text-gray-100'}">${s.text}</span>
                            <div class="flex gap-2">
                                <button onclick="toggleSubtask(${goal.id}, '${s.text.replace(/'/g, "\\'")}')" class="bg-${s.completed ? 'green' : 'blue'}-600 hover:bg-${s.completed ? 'green' : 'blue'}-700 text-white px-3 py-1 rounded text-sm">${s.completed ? 'إلغاء' : 'إكمال'}</button>
                                <button onclick="splitSubtask(${goal.id}, '${s.text.replace(/'/g, "\\'")}')" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">تقسيم</button>
                                <button onclick="deleteSubtask(${goal.id}, '${s.text.replace(/'/g, "\\'")}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">حذف</button>
                            </div>
                        </div>
                        <input id="notes-${goal.id}-${s.text.replace(/'/g, '-')}" type="text" value="${s.notes || ''}" placeholder="ملاحظات (مثل روابط، خطوات)" class="bg-gray-700 text-gray-100 p-2 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" onblur="updateSubtaskNotes(${goal.id}, '${s.text.replace(/'/g, "\\'")}', this.value)">
                    </li>
                `).join('')}
            </ul>
            <div class="flex gap-4 mb-4">
                <input id="new-subtask-${goal.id}" type="text" placeholder="أضف درس جديد" class="bg-gray-700 text-gray-100 p-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button onclick="addSubtask(${goal.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">إضافة درس</button>
            </div>
            <div class="flex gap-4">
                <button onclick="editGoal(${goal.id})" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition" aria-label="تعديل ${goal.title}">تعديل</button>
                <button onclick="deleteGoal(${goal.id})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition" aria-label="حذف ${goal.title}">حذف</button>
            </div>
        `;
        goalsList.appendChild(goalEl);
    });
}

function toggleSubtask(goalId, subtaskText) {
    const goal = data.goals.find(g => g.id === goalId);
    const subtask = goal.subtasks.find(s => s.text === subtaskText);
    subtask.completed = !subtask.completed;
    if (subtask.completed) {
        data.xp += 10;
        data.todayXP = (data.todayXP || 0) + 10;
        showNotification('مبروك! تم إكمال درس (+10 XP)!');
        animateXP(10);
    } else {
        data.xp = Math.max(0, data.xp - 10);
        data.todayXP = Math.max(0, (data.todayXP || 0) - 10);
    }
    if (goal.subtasks.every(s => s.completed) && !goal.completed) {
        goal.completed = true;
        const bonusXP = goal.subtasks.length * 10;
        data.xp += bonusXP;
        data.todayXP = (data.todayXP || 0) + bonusXP;
        data.badges.push(`إكمال هدف: ${goal.title}`);
        showNotification(`مبروك! تم إكمال الهدف: ${goal.title} (+${bonusXP} XP مكافأة)!`);
        animateXP(bonusXP);
        checkAchievements();
    }
    saveData();
    updateGoals(document.getElementById('goals-page-filter').value);
    updateDashboardGoals(document.getElementById('goal-filter').value);
    updateDashboard();
    updateAchievements();
}

function updateSubtaskNotes(goalId, subtaskText, value) {
    const goal = data.goals.find(g => g.id === goalId);
    const subtask = goal.subtasks.find(s => s.text === subtaskText);
    subtask.notes = value.trim();
    saveData();
    showNotification('تم حفظ الملاحظة!');
}

function splitSubtask(goalId, subtaskText) {
    const newSubtasks = prompt('أدخل الدروس الفرعية (كل درس في سطر):', subtaskText)?.split('\n').filter(s => s.trim()).map(s => ({
        text: s.trim(),
        notes: '',
        completed: false
    }));
    if (!newSubtasks || newSubtasks.length === 0) return;
    const goal = data.goals.find(g => g.id === goalId);
    const subtaskIndex = goal.subtasks.findIndex(s => s.text === subtaskText);
    goal.subtasks.splice(subtaskIndex, 1, ...newSubtasks);
    saveData();
    updateGoals(document.getElementById('goals-page-filter').value);
    updateDashboardGoals(document.getElementById('goal-filter').value);
    showNotification('تم تقسيم الدرس!');
}

function deleteSubtask(goalId, subtaskText) {
    const goal = data.goals.find(g => g.id === goalId);
    goal.subtasks = goal.subtasks.filter(s => s.text !== subtaskText);
    goal.completed = goal.subtasks.every(s => s.completed);
    saveData();
    updateGoals(document.getElementById('goals-page-filter').value);
    updateDashboardGoals(document.getElementById('goal-filter').value);
    showNotification('تم حذف الدرس!');
}

function addSubtask(goalId) {
    const input = document.getElementById(`new-subtask-${goalId}`);
    const newSubtask = input.value.trim();
    if (newSubtask) {
        const goal = data.goals.find(g => g.id === goalId);
        goal.subtasks.push({ text: newSubtask, notes: '', completed: false });
        input.value = '';
        saveData();
        updateGoals(document.getElementById('goals-page-filter').value);
        updateDashboardGoals(document.getElementById('goal-filter').value);
        showNotification('تم إضافة درس!');
    }
}

function editGoal(id) {
    const goal = data.goals.find(g => g.id === id);
    if (!goal) return;
    document.getElementById('goal-title').value = goal.title;
    document.getElementById('goal-date').value = goal.date;
    document.getElementById('goal-priority').value = goal.priority;
    document.getElementById('goal-subtasks').value = goal.subtasks.map(s => s.text).join('\n');
    showAddModal();
    showTab('goal-tab');
    const form = document.getElementById('goal-form');
    const originalSubmit = form.onsubmit;
    form.onsubmit = e => {
        e.preventDefault();
        goal.title = document.getElementById('goal-title').value;
        goal.date = document.getElementById('goal-date').value;
        goal.priority = document.getElementById('goal-priority').value;
        goal.subtasks = document.getElementById('goal-subtasks').value.split('\n').filter(s => s.trim()).map(s => ({
            text: s.trim(),
            notes: goal.subtasks.find(old => old.text === s.trim())?.notes || '',
            completed: goal.subtasks.find(old => old.text === s.trim())?.completed || false
        }));
        goal.completed = goal.subtasks.every(s => s.completed);
        saveData();
        updateGoals(document.getElementById('goals-page-filter').value);
        updateDashboardGoals(document.getElementById('goal-filter').value);
        updateDashboard();
        showNotification('تم تعديل الهدف!');
        closeAddModal();
        form.onsubmit = originalSubmit;
    };
}

function deleteGoal(id) {
    data.goals = data.goals.filter(g => g.id !== id);
    saveData();
    updateGoals(document.getElementById('goals-page-filter').value);
    updateDashboardGoals(document.getElementById('goal-filter').value);
    updateDashboard();
    showNotification('تم حذف الهدف!');
}

function checkAchievements() {
    if (data.xp >= 50 && !data.badges.includes('مبتدئ')) {
        data.badges.push('مبتدئ');
        showNotification('مبروك! حصلت على شارة: مبتدئ');
    }
    if (data.xp >= 250 && !data.badges.includes('محترف')) {
        data.badges.push('محترف');
        showNotification('مبروك! حصلت على شارة: محترف');
    }
    saveData();
    updateAchievements();
}

function updateAchievements() {
    document.getElementById('level').textContent = Math.floor(data.xp / 100) + 1;
    document.getElementById('total-xp').textContent = data.xp;
    document.getElementById('completed-goals').textContent = data.goals.filter(g => g.completed).length;
    document.getElementById('avg-xp').textContent = Math.round(data.xp / (data.daysActive || 1));
    const badgesList = document.getElementById('badges-list');
    badgesList.innerHTML = data.badges.map(b => `
        <div class="bg-blue-600 p-4 rounded-lg shadow-md text-center text-gray-100">${b}</div>
    `).join('');
}

function animateXP(amount) {
    const totalXPEl = document.getElementById('total-xp');
    const todayXPEl = document.getElementById('xp-today');
    let currentXP = parseInt(totalXPEl.textContent);
    let currentTodayXP = parseInt(todayXPEl.textContent);
    const targetXP = currentXP + amount;
    const targetTodayXP = currentTodayXP + amount;
    let step = 0;
    const steps = 20;
    const interval = setInterval(() => {
        step++;
        totalXPEl.textContent = Math.round(currentXP + (step / steps) * amount);
        todayXPEl.textContent = Math.round(currentTodayXP + (step / steps) * amount);
        if (step >= steps) {
            totalXPEl.textContent = targetXP;
            todayXPEl.textContent = targetTodayXP;
            clearInterval(interval);
        }
    }, 50);
}