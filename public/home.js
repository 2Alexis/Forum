document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    let currentPage = 1;
    const navbar = document.querySelector('nav ul');

    if (!user) {
        navbar.innerHTML = `
            <li><a href="home.html">Accueil</a></li>
            <li><a href="login.html">Connexion</a></li>
            <li><a href="index.html">Inscription</a></li>
        `;
    } else {
        navbar.innerHTML = `
            <li><a href="home.html">Accueil</a></li>
            <li class="dropdown">
                <a href="#">Catégories</a>
                <div class="dropdown-content" id="categories-dropdown">
                </div>
            </li>
            <li><a href="profile.html?id=${user.id}" id="profile-link">Profil</a></li>
            <li><a href="#" id="logout">Déconnexion</a></li>
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
                    const profilePicContainer = document.getElementById('user-profile-pic-container');
                    profilePicContainer.innerHTML = `
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
            throw Error(response.statusText);
        }
        return response.json();
    }

    function loadCategories() {
        fetch('http://localhost:3000/categories')
            .then(handleError)
            .then(data => {
                if (data.success) {
                    const categoriesDropdown = document.getElementById('categories-dropdown');
                    data.categories.forEach(category => {
                        const categoryElement = document.createElement('a');
                        categoryElement.href = `#`;
                        categoryElement.textContent = category.name;
                        categoryElement.addEventListener('click', () => {
                            loadTopicsByCategory(category.id);
                        });
                        categoriesDropdown.appendChild(categoryElement);
                    });
                } else {
                    console.error('Failed to load categories:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function createTagElements(tags) {
        return tags.split(',').map(tag => `<div class="tag">${tag.trim()}</div>`).join('');
    }

    function loadTopics(page) {
        fetch(`http://localhost:3000/topics?page=${page}`)
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
                            <div><strong>Tags:</strong> ${createTagElements(topic.tags)}</div>
                            <div id="user-info">
                                <img class="profile-pic" src="${topic.author_profile_pic}" alt="Profile Picture">
                                <p><a id="author" href="user-profile.html?id=${topic.author_id}">${topic.author_name}</a></p>
                            </div>
                            <p><strong>Created at:</strong> ${new Date(topic.created_at).toLocaleString()}</p>
                            <button class="like-button" data-topic-id="${topic.id}" data-type="like">Like</button>
                            <button class="dislike-button" data-topic-id="${topic.id}" data-type="dislike">Dislike</button>
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
                } else {
                    console.error('Failed to load topics:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function loadTopicsByCategory(categoryId) {
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
                            <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                            <p>${topic.body}</p>
                            <div><strong>Tags:</strong> ${createTagElements(topic.tags)}</div>
                            <div>
                                <img src="${topic.author_profile_pic}" alt="Profile Picture">
                                <p><a href="user-profile.html?id=${topic.author_id}">${topic.author_name}</a></p>
                            </div>
                            <p><strong>Created at:</strong> ${new Date(topic.created_at).toLocaleString()}</p>
                            <button class="like-button" data-topic-id="${topic.id}" data-type="like">Like</button>
                            <button class="dislike-button" data-topic-id="${topic.id}" data-type="dislike">Dislike</button>
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
                    console.error('Failed to load topics:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadTopics(currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        currentPage++;
        loadTopics(currentPage);
    });

    loadTopics(currentPage);

    function loadPopularTopics() {
        fetch('http://localhost:3000/popular-topics')
            .then(handleError)
            .then(data => {
                if (data.success) {
                    const popularTopicsContainer = document.getElementById('bot-left-container');
                    popularTopicsContainer.innerHTML = '';
                    data.topics.forEach(topic => {
                        const topicElement = document.createElement('div');
                        topicElement.classList.add('populartopic');
                        topicElement.innerHTML = `
                            <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                        `;
                        popularTopicsContainer.appendChild(topicElement);
                    });
                } else {
                    console.error('Failed to load popular topics:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    loadPopularTopics();

    function updateLikedTopics() {
        fetch(`http://localhost:3000/liked-topics/${user.id}`)
            .then(handleError)
            .then(data => {
                if (data.success) {
                    const likedTopicsContainer = document.getElementById('liked-topics-container');
                    likedTopicsContainer.innerHTML = '';
                    if (data.topics.length > 0) {
                        const topic = data.topics[0]; // Get only the first liked topic
                        likedTopicsContainer.innerHTML = `
                            <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                        `;
                    } else {
                        likedTopicsContainer.innerHTML = '<p>Vous n\'avez aimé aucun topic.</p>';
                    }
                } else {
                    console.error('Failed to load liked topics:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    updateLikedTopics();

    document.getElementById('show-all-liked-topics').addEventListener('click', function() {
        fetch(`http://localhost:3000/liked-topics/${user.id}`)
            .then(handleError)
            .then(data => {
                if (data.success) {
                    let topicsList = '';
                    data.topics.forEach(topic => {
                        topicsList += `
                            <div>
                                <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                                <p>${topic.body}</p>
                            </div>
                        `;
                    });
                    const popup = document.createElement('div');
                    popup.classList.add('popup');
                    popup.innerHTML = `
                        <div class="popup-content">
                            <span class="close-button">&times;</span>
                            ${topicsList}
                        </div>
                    `;
                    document.body.appendChild(popup);
                    document.querySelector('.close-button').addEventListener('click', function() {
                        document.body.removeChild(popup);
                    });
                } else {
                    console.error('Failed to load liked topics:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    });

    loadCategories();
});
