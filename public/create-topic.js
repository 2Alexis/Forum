document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Vous devez être connecté pour créer un topic.');
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('author').value = user.id;

    function loadCategories() {
        fetch('http://localhost:3000/categories')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const categorySelect = document.getElementById('category');
                    data.categories.forEach(category => {
                        const categoryOption = document.createElement('option');
                        categoryOption.value = category.id;
                        categoryOption.textContent = category.name;
                        categorySelect.appendChild(categoryOption);
                    });
                } else {
                    console.error('Failed to load categories:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    loadCategories();

    document.getElementById('createTopicForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const body = document.getElementById('body').value;
        const tags = document.getElementById('tags').value;
        const author_id = document.getElementById('author').value;
        const state = document.getElementById('state').value;
        const category_id = document.getElementById('category').value;

        fetch('http://localhost:3000/create-topic', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, body, tags, author_id, state, category_id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Topic créé avec succès !');
                window.location.href = 'home.html';
            } else {
                alert('Erreur : ' + data.message);
            }
        })
        .catch(error => console.error('Erreur:', error));
    });

    document.getElementById('logout').addEventListener('click', function() {
        localStorage.removeItem('user');
        alert('Vous avez été déconnecté.');
        window.location.href = 'login.html';
    });
});
