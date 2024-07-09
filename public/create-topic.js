document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const navRight = document.querySelector('.nav-right');
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
                    const categoriesDropdown = document.getElementById('categories-dropdown');
                    data.categories.forEach(category => {
                        const categoryOption = document.createElement('option');
                        categoryOption.value = category.id;
                        categoryOption.textContent = category.name;
                        categoryOption.classList.add('category-option');
                        categorySelect.appendChild(categoryOption);

                        const categoryLink = document.createElement('a');
                        categoryLink.href = `#`;
                        categoryLink.textContent = category.name;
                        categoryLink.addEventListener('click', () => {
                            loadTopicsByCategory(category.id, category.name);
                        });
                        categoriesDropdown.appendChild(categoryLink);
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
        const author_id = user.id;
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

    if (!user) {
        navRight.innerHTML = `
            <li><a href="login.html">Connexion</a></li>
            <li><a href="index.html">Inscription</a></li>
        `;
    } else {
        navRight.innerHTML = `
            <li><a href="profile.html?id=${user.id}" id="profile-link">Profil</a></li>
            <li><a href="#" id="friend-requests">Demandes d'amis</a></li>
            <li><a href="#" id="logout"><img src="deco.png" id="deco" alt="Déconnexion"></a></li>
        `;

        document.getElementById('logout').addEventListener('click', function() {
            localStorage.removeItem('user');
            alert('Vous avez été déconnecté.');
            window.location.href = 'login.html';
        });

        // Fetch and display the profile picture
        fetch(`http://localhost:3000/user/${user.id}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const profileLink = document.getElementById('profile-link');
                    profileLink.innerHTML = `
                        <img src="${data.user.profile_pic}" alt="Profile Picture" class="profile-pic"> 
                    `;
                } else {
                    console.error('Erreur : ' + data.message);
                }
            })
            .catch(error => console.error('Erreur:', error));
    }

    function handleError(response) {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error('Error: ' + errorData.message);
            });
        }
        return response.json();
    }

    // Search functionality
    const searchBar = document.getElementById('search-bar');
    const searchButton = document.getElementById('search-button');
    const resetSearchButton = document.getElementById('reset-search-button');
    resetSearchButton.style.display = 'none'; // Hide reset button initially

    searchButton.addEventListener('click', function() {
        const searchQuery = searchBar.value.trim();
        if (searchQuery) {
            fetch(`http://localhost:3000/search-topics?title=${encodeURIComponent(searchQuery)}`)
                .then(handleError)
                .then(data => {
                    if (data.success) {
                        const topicsContainer = document.getElementById('topics-container');
                        topicsContainer.innerHTML = '';
                        data.topics.forEach(topic => {
                            const topicElement = document.createElement('div');
                            topicElement.classList.add('topic');
                            topicElement.innerHTML = `
                                <h2><a id="title-topic" href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                                <p>${topic.body}</p>
                                <div> ${createTagElements(topic.tags)}</div>
                                <div id="user-info">
                                    <img class="profile-pic" src="${topic.author_profile_pic}" alt="Profile Picture">
                                    <p><a id="author" href="profile.html?id=${topic.author_id}">${topic.author_name}</a></p>
                                </div>
                                <p><strong>Created at:</strong> ${new Date(topic.created_at).toLocaleString()}</p>
                                <div id="pouces">
                                <button class="like-button" data-topic-id="${topic.id}" data-type="like"><img class="pouce" src="poucehaut.png" class="pouce"></button>
                                <button class="dislike-button" data-topic-id="${topic.id}" data-type="dislike"><img class="pouce" src="poucebas.png" class="pouce"></button>
                                </div>
                            `;
                            topicsContainer.appendChild(topicElement);
                        });
                        document.querySelectorAll('.like-button, .dislike-button').forEach(button => {
                            button.addEventListener('click', function() {
                                const topicId = this.getAttribute('data-topic-id');
                                const type = this.getAttribute('data-type');
                                fetch('http://localhost:3000/like', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ user_id: user.id, topic_id: topicId, type })
                                })
                                .then(handleError)
                                .then(data => {
                                    if (data.success) {
                                        alert(`${type === 'like' ? 'Liked' : 'Disliked'} successfully!`);
                                        loadTopics(currentPage);
                                        updateLikedTopics();
                                    } else {
                                        alert('Erreur : ' + data.message);
                                    }
                                })
                                .catch(error => console.error('Erreur:', error));
                            });
                        });
                        resetSearchButton.style.display = 'block'; // Show reset button
                    } else {
                        console.error('Failed to search topics:', data.message);
                    }
                })
                .catch(error => console.error('Error:', error));
        }
    });

    resetSearchButton.addEventListener('click', function() {
        searchBar.value = '';
        resetSearchButton.style.display = 'none';
        loadTopics(currentPage);
        window.location.href = 'home.html'; // Navigate to home page
    });

    function loadTopicsByCategory(categoryId, categoryName) {
        fetch(`http://localhost:3000/topics/category/${categoryId}`)
            .then(handleError)
            .then(data => {
                if (data.success) {
                    const topicsContainer = document.getElementById('topics-container');
                    topicsContainer.innerHTML = '';
                    data.topics.forEach(topic => {
                        const topicElement = document.createElement('div');
                        topicElement.classList.add('topic');
                        topicElement.innerHTML = `
                            <h2><a id="title-topic" href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                            <p>${topic.body}</p>
                            <div> ${createTagElements(topic.tags)}</div>
                            <div id="user-info">
                                <img class="profile-pic" src="${topic.author_profile_pic}" alt="Profile Picture">
                                <p><a id="author" href="profile.html?id=${topic.author_id}">${topic.author_name}</a></p>
                            </div>
                            <p><strong>Created at:</strong> ${new Date(topic.created_at).toLocaleString()}</p>
                            <div id="pouces">
                            <button class="like-button" data-topic-id="${topic.id}" data-type="like"><img class="pouce" src="poucehaut.png" class="pouce"></button>
                            <button class="dislike-button" data-topic-id="${topic.id}" data-type="dislike"><img class="pouce" src="poucebas.png" class="pouce"></button>
                            </div>
                        `;
                        topicsContainer.appendChild(topicElement);
                    });

                    // Afficher le message de résultat
                    const categoryResult = document.getElementById('category-result');
                    categoryResult.textContent = `${data.topics.length} résultat(s) pour la catégorie "${categoryName}"`;
                    categoryResult.style.display = 'block';

                    document.querySelectorAll('.like-button, .dislike-button').forEach(button => {
                        button.addEventListener('click', function() {
                            const topicId = this.getAttribute('data-topic-id');
                            const type = this.getAttribute('data-type');
                            fetch('http://localhost:3000/like', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ user_id: user.id, topic_id: topicId, type })
                            })
                            .then(handleError)
                            .then(data => {
                                if (data.success) {
                                    alert(`${type === 'like' ? 'Liked' : 'Disliked'} successfully!`);
                                    loadTopicsByCategory(categoryId);
                                    updateLikedTopics();
                                } else {
                                    alert('Erreur : ' + data.message);
                                }
                            })
                            .catch(error => console.error('Erreur:', error));
                        });
                    });
                } else {
                    console.error('Failed to load topics by category:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function createTagElements(tags) {
        return tags.split(',').map(tag => `<div class="tag">${tag.trim()}</div>`).join('');
    }
});
