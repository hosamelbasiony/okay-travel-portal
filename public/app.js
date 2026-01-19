document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const visaTab = document.getElementById('visa-tab');
    const generalTab = document.getElementById('general-tab');
    const usersTab = document.getElementById('users-tab');
    const visaContent = document.getElementById('visa-content');
    const generalContent = document.getElementById('general-content');
    const usersContent = document.getElementById('users-content');
    const paginationContainer = document.getElementById('pagination');
    const addBtn = document.getElementById('add-btn');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const passModal = document.getElementById('pass-modal');
    const passForm = document.getElementById('pass-form');
    const closePassBtn = document.getElementById('close-pass-btn');
    const copyTokenBtn = document.getElementById('copy-token-btn');
    const bulkBtn = document.getElementById('bulk-import-btn');
    const bulkModal = document.getElementById('bulk-modal');
    const closeBulkBtn = document.getElementById('close-bulk-btn');
    const processBulkBtn = document.getElementById('process-bulk-btn');
    const loading = document.getElementById('loading');
    const errorBox = document.getElementById('error-message');

    // View Toggle Elements
    const cardViewBtn = document.getElementById('card-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    let currentTab = 'visa';
    let isEditing = false;
    let viewMode = localStorage.getItem('viewMode') || 'card';

    // Pagination State
    let currentPage = 1;
    let itemsPerPage = 8;
    let totalPages = 1;

    // Check auth status
    const checkAuth = async () => {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                showApp();
            } else {
                showLogin();
            }
        } catch (err) {
            showLogin();
        }
    };

    const showApp = () => {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        applyViewMode();
        fetchData(currentTab);
    };

    const showLogin = () => {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    };

    // Auth Handlers
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target[0].value;
        const password = e.target[1].value;
        const errorText = document.getElementById('login-error');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                showApp();
            } else {
                errorText.classList.remove('hidden');
            }
        } catch (err) {
            errorText.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        showLogin();
    });

    // Settings (Pass/Token) Handlers
    settingsBtn.addEventListener('click', () => {
        passModal.classList.remove('hidden');
        document.getElementById('pass-msg').classList.add('hidden');
        passForm.reset();
    });

    closePassBtn.addEventListener('click', () => passModal.classList.add('hidden'));

    passForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldPassword = document.getElementById('old-pass').value;
        const newPassword = document.getElementById('new-pass').value;
        const msg = document.getElementById('pass-msg');

        try {
            const res = await fetch('/api/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();

            msg.innerText = data.message || data.error;
            msg.style.color = res.ok ? '#4ade80' : '#f87171';
            msg.classList.remove('hidden');

            if (res.ok) setTimeout(() => passModal.classList.add('hidden'), 2000);
        } catch (err) {
            msg.innerText = 'حدث خطأ ما';
            msg.classList.remove('hidden');
        }
    });

    copyTokenBtn.onclick = async () => {
        try {
            const res = await fetch('/api/token');
            const data = await res.json();
            if (data.token) {
                await navigator.clipboard.writeText(data.token);
                const originalText = copyTokenBtn.innerText;
                copyTokenBtn.innerText = 'تم النسخ!';
                setTimeout(() => copyTokenBtn.innerText = originalText, 2000);
            }
        } catch (err) {
            alert('فشل في نسخ التوكن');
        }
    };

    // Bulk Import Logic
    bulkBtn.onclick = () => {
        bulkModal.classList.remove('hidden');
        document.getElementById('bulk-msg').classList.add('hidden');
        document.getElementById('bulk-json-input').value = '';
    };

    closeBulkBtn.onclick = () => bulkModal.classList.add('hidden');

    processBulkBtn.onclick = async () => {
        const jsonStr = document.getElementById('bulk-json-input').value;
        const msg = document.getElementById('bulk-msg');

        try {
            const data = JSON.parse(jsonStr);
            if (!Array.isArray(data)) throw new Error('يجب أن تكون المدخلات مصفوفة JSON');

            msg.innerText = 'جاري المعالجة...';
            msg.classList.remove('hidden');

            const res = await fetch(`/api/${currentTab === 'visa' ? 'visa-info' : 'general-info'}/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (res.ok) {
                msg.innerText = 'تم الاستيراد بنجاح!';
                msg.style.color = '#4ade80';
                setTimeout(() => {
                    bulkModal.classList.add('hidden');
                    fetchData(currentTab);
                }, 1500);
            } else {
                throw new Error(result.error || 'حدث خطأ أثناء الاستيراد');
            }
        } catch (err) {
            msg.innerText = err.message;
            msg.style.color = '#f87171';
            msg.classList.remove('hidden');
        }
    };

    // Tab Switching
    const switchTab = (tab) => {
        currentTab = tab;
        currentPage = 1; // Reset to page 1 on tab switch
        [visaTab, generalTab, usersTab].forEach(btn => btn.classList.remove('active'));
        [visaContent, generalContent, usersContent].forEach(c => c.classList.remove('active'));

        document.getElementById(tab + '-tab').classList.add('active');
        document.getElementById(tab + '-content').classList.add('active');

        // Hide/Show View Toggle and Add/Bulk Buttons based on tab
        if (tab === 'users') {
            document.querySelector('.view-toggle').style.display = 'none';
            bulkBtn.style.display = 'none';
            paginationContainer.style.display = 'none';
        } else {
            document.querySelector('.view-toggle').style.display = 'flex';
            bulkBtn.style.display = 'flex';
            paginationContainer.style.display = 'flex';
        }

        fetchData(tab);
    };

    visaTab.addEventListener('click', () => switchTab('visa'));
    generalTab.addEventListener('click', () => switchTab('general'));
    usersTab.addEventListener('click', () => switchTab('users'));

    // View Toggle Logic
    const applyViewMode = () => {
        [cardViewBtn, listViewBtn].forEach(btn => btn.classList.remove('active'));
        [visaContent, generalContent].forEach(c => {
            c.classList.remove('list-view');
            if (viewMode === 'list') c.classList.add('list-view');
        });

        if (viewMode === 'card') {
            cardViewBtn.classList.add('active');
        } else {
            listViewBtn.classList.add('active');
        }
        localStorage.setItem('viewMode', viewMode);
        if (currentTab !== 'users') fetchData(currentTab);
    };

    cardViewBtn.addEventListener('click', () => {
        viewMode = 'card';
        applyViewMode();
    });

    listViewBtn.addEventListener('click', () => {
        viewMode = 'list';
        applyViewMode();
    });

    // CRUD Logic
    const fetchData = async (type) => {
        loading.classList.remove('hidden');
        errorBox.classList.add('hidden');

        let endpoint = `/api/${type === 'users' ? 'users' : type + '-info'}`;
        if (type !== 'users') {
            endpoint += `?page=${currentPage}&limit=${itemsPerPage}`;
        }

        try {
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error();
            const result = await res.json();

            if (type === 'users') {
                renderData(type, result);
            } else {
                totalPages = result.pagination.totalPages;
                renderData(type, result.data);
                renderPagination();
            }
        } catch (err) {
            errorBox.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    };

    const renderData = (type, data) => {
        const container = document.getElementById(type + '-content');
        container.innerHTML = '';

        if (type === 'users') {
            const table = document.createElement('table');
            table.className = 'users-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>اسم المستخدم</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            data.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td><button class="btn-delete-small">حذف</button></td>
                `;
                tr.querySelector('.btn-delete-small').onclick = () => deleteUser(user.id);
                tbody.appendChild(tr);
            });
            container.appendChild(table);
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';

            if (type === 'visa') {
                const badgeHtml = `<div class="badge">${item.visa_type}</div>`;
                const contentHtml = `
                    <div class="card-info">
                        <h3 style="margin-top: ${viewMode === 'list' ? '0' : '0.5rem'};">${item.question}</h3>
                        <p>${item.answer}</p>
                        <div class="meta">
                            <div class="meta-item"><span class="meta-label">التأشيرة:</span><span class="meta-value">${item.visa_name}</span></div>
                            <div class="meta-item"><span class="meta-label">متاحة لـ:</span><span class="meta-value">${item.eligible_for}</span></div>
                        </div>
                    </div>
                `;
                card.innerHTML = (item.visa_type ? badgeHtml : '') + contentHtml;
            } else {
                card.innerHTML = `<div class="card-info"><h3>${item.question}</h3><p>${item.answer}</p></div>`;
            }

            const actions = document.createElement('div');
            actions.className = 'card-actions';
            actions.innerHTML = `
                <button class="btn-edit">تعديل</button>
                <button class="btn-delete">حذف</button>
            `;

            actions.querySelector('.btn-edit').onclick = (e) => {
                e.stopPropagation();
                openEditModal(item);
            };
            actions.querySelector('.btn-delete').onclick = (e) => {
                e.stopPropagation();
                deleteItem(item.id);
            };

            card.appendChild(actions);
            container.appendChild(card);
        });
    };

    const renderPagination = () => {
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.innerText = 'السابق';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            currentPage--;
            fetchData(currentTab);
        };
        paginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                const pageBtn = document.createElement('button');
                pageBtn.innerText = i;
                if (i === currentPage) pageBtn.classList.add('active');
                pageBtn.onclick = () => {
                    currentPage = i;
                    fetchData(currentTab);
                };
                paginationContainer.appendChild(pageBtn);
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                const span = document.createElement('span');
                span.innerText = '...';
                paginationContainer.appendChild(span);
            }
        }

        const nextBtn = document.createElement('button');
        nextBtn.innerText = 'التالي';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            currentPage++;
            fetchData(currentTab);
        };
        paginationContainer.appendChild(nextBtn);
    };

    // Modal Handlers
    const openEditModal = (item = null) => {
        isEditing = !!item;
        document.getElementById('modal-title').innerText = isEditing ? 'تعديل ' : 'إضافة ';

        // Toggle fields visibility
        document.getElementById('visa-fields').classList.add('hidden');
        document.getElementById('user-fields').classList.add('hidden');
        document.getElementById('content-fields').classList.add('hidden');

        if (currentTab === 'users') {
            document.getElementById('user-fields').classList.remove('hidden');
            document.getElementById('modal-title').innerText += 'مستخدم';
        } else {
            document.getElementById('content-fields').classList.remove('hidden');
            if (currentTab === 'visa') {
                document.getElementById('visa-fields').classList.remove('hidden');
                document.getElementById('modal-title').innerText += 'تأشيرة';
            } else {
                document.getElementById('modal-title').innerText += 'بيان عام';
            }
        }

        editForm.reset();
        document.getElementById('edit-id').value = item ? item.id : '';

        if (item) {
            if (currentTab !== 'users') {
                document.getElementById('edit-question').value = item.question;
                document.getElementById('edit-answer').value = item.answer;
                if (currentTab === 'visa') {
                    document.getElementById('edit-visa-name').value = item.visa_name;
                    document.getElementById('edit-visa-type').value = item.visa_type;
                    document.getElementById('edit-eligible-for').value = item.eligible_for;
                }
            } else {
                document.getElementById('edit-user-name').value = item.username;
            }
        }

        editModal.classList.remove('hidden');
    };

    addBtn.onclick = () => openEditModal();
    cancelBtn.onclick = () => editModal.classList.add('hidden');

    editForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const endpoint = `/api/${currentTab === 'users' ? 'users' : currentTab + '-info'}${isEditing ? '/' + id : ''}`;
        const method = isEditing ? 'PUT' : 'POST';

        let body = {};
        if (currentTab === 'users') {
            body = {
                username: document.getElementById('edit-user-name').value,
                password: document.getElementById('edit-user-pass').value
            };
        } else {
            body = {
                question: document.getElementById('edit-question').value,
                answer: document.getElementById('edit-answer').value
            };
            if (currentTab === 'visa') {
                body.visa_name = document.getElementById('edit-visa-name').value;
                body.visa_type = document.getElementById('edit-visa-type').value;
                body.eligible_for = document.getElementById('edit-eligible-for').value;
            }
        }

        const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            editModal.classList.add('hidden');
            fetchData(currentTab);
        } else {
            const data = await res.json();
            alert(data.error || 'حدث خطأ ما');
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        const res = await fetch(`/api/${currentTab}-info/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData(currentTab);
    };

    const deleteUser = async (id) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchData('users');
        } else {
            const data = await res.json();
            alert(data.error);
        }
    };

    checkAuth();
});
