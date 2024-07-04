document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const navRight = document.querySelector('.nav-right');
    let currentPage = 1; // Ajout de la déclaration de currentPage
    let currentPopup = null; // Suivi du popup actuellement ouvert

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

        document.getElementById('friend-requests').addEventListener('click', function() {
            fetch(`http://localhost:3000/pending-friend-requests/${user.id}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        let requestsList = '';
                        data.requests.forEach(request => {
                            requestsList += `
                                <div class="friend-request">
                                    <img src="${request.profile_pic}" alt="${request.username}">
                                    <p>${request.username}</p>
                                    <button class="accept-request" data-id="${request.requester_id}">Accepter</button>
                                    <button class="reject-request" data-id="${request.requester_id}">Rejeter</button>
                                </div>
                            `;
                        });
                        const popup = document.createElement('div');
                        popup.classList.add('popup');
                        popup.innerHTML = `
                            <div class="popup-content">
                                <span class="close-button">&times;</span>
                                ${requestsList}
                            </div>
                        `;
                        document.body.appendChild(popup);
                        document.querySelector('.close-button').addEventListener('click', function() {
                            document.body.removeChild(popup);
                        });
                        document.querySelectorAll('.accept-request').forEach(button => {
                            button.addEventListener('click', function() {
                                const requesterId = this.getAttribute('data-id');
                                fetch('http://localhost:3000/accept-friend-request', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ requester_id: requesterId, receiver_id: user.id })
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        alert('Demande d\'ami acceptée.');
                                        this.parentElement.style.display = 'none'; // Masquer la demande acceptée
                                    } else {
                                        alert('Erreur : ' + data.message);
                                    }
                                });
                            });
                        });
                        document.querySelectorAll('.reject-request').forEach(button => {
                            button.addEventListener('click', function() {
                                const requesterId = this.getAttribute('data-id');
                                fetch('http://localhost:3000/reject-friend-request', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ requester_id: requesterId, receiver_id: user.id })
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if (data.success) {
                                        alert('Demande d\'ami rejetée.');
                                        this.parentElement.style.display = 'none'; // Masquer la demande rejetée
                                    } else {
                                        alert('Erreur : ' + data.message);
                                    }
                                });
                            });
                        });
                    } else {
                        console.error('Failed to load friend requests:', data.message);
                    }
                })
                .catch(error => console.error('Error:', error));
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
                    const userProfilePicContainer = document.getElementById('user-profile-pic-container');
                    userProfilePicContainer.innerHTML = `
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

    function loadCategories() {
        fetch('http://localhost:3000/categories')
            .then(handleError)
            .then(data => {
                if (data.success) {
                    const categoriesDropdown = document.getElementById('categories-dropdown');
                    categoriesDropdown.innerHTML = ''; // Clear any existing categories
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

                    document.getElementById('prev-page').style.display = currentPage > 1 ? 'block' : 'none';
                    document.getElementById('next-page').style.display = data.topics.length === 6 ? 'block' : 'none';

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
        console.log('Loading topics for category ID:', categoryId); // Debug log
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

                    document.getElementById('prev-page').style.display = currentPage > 1 ? 'block' : 'none';
                    document.getElementById('next-page').style.display = data.topics.length === 6 ? 'block' : 'none';

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

    function closeCurrentPopup() {
        if (currentPopup) {
            document.body.removeChild(currentPopup);
            currentPopup = null;
        }
    }

    function loadPopularTopics() {
        fetch('http://localhost:3000/popular-topics')
            .then(handleError)
            .then(data => {
                if (data.success) {
                    const popularTopicsContainer = document.getElementById('popular-topics-container');
                    popularTopicsContainer.innerHTML = '';
                    if (data.topics.length > 0) {
                        const topic = data.topics[0]; // Get only the first popular topic
                        popularTopicsContainer.innerHTML = `
                            <h2><a id="liked" href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                        `;
                    } else {
                        popularTopicsContainer.innerHTML = '<p>Aucun topic populaire.</p>';
                    }
                } else {
                    console.error('Failed to load popular topics:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    }

    loadPopularTopics();

    document.getElementById('show-all-popular-topics').addEventListener('click', function() {
        fetch('http://localhost:3000/popular-topics')
            .then(handleError)
            .then(data => {
                if (data.success) {
                    closeCurrentPopup(); // Fermer le popup actuel avant d'ouvrir le nouveau
                    let topicsList = '';
                    data.topics.forEach(topic => {
                        topicsList += `
                            <div>
                                <h2><a href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                                <p id="separation"></p>
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
                    currentPopup = popup; // Définir le popup actuel
                    document.querySelector('.close-button').addEventListener('click', function() {
                        document.body.removeChild(popup);
                        currentPopup = null; // Réinitialiser le popup actuel
                    });
                } else {
                    console.error('Failed to load popular topics:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    });

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
                            <h2><a id="liked" href="topic.html?id=${topic.id}">${topic.title}</a></h2>
                        `;
                    } else {
                        likedTopicsContainer.innerHTML = '<p id="aimer">Vous n\'avez aimé aucun topic.</p>';
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
                    closeCurrentPopup(); // Fermer le popup actuel avant d'ouvrir le nouveau
                    let topicsList = '';
                    data.topics.forEach(topic => {
                        topicsList += `
                            <div id="liked-topics-container">
                                <h2><a id="liked" href="topic.html?id=${topic.id}">${topic.title}</a></h2>
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
                    currentPopup = popup; // Définir le popup actuel
                    document.querySelector('.close-button').addEventListener('click', function() {
                        document.body.removeChild(popup);
                        currentPopup = null; // Réinitialiser le popup actuel
                    });
                } else {
                    console.error('Failed to load liked topics:', data.message);
                }
            })
            .catch(error => console.error('Error:', error));
    });

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

    loadCategories();
});
