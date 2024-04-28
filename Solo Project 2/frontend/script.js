window.addEventListener('DOMContentLoaded', async () => {
    try{
        const blogPostResponse = await fetch('/blogs/');
        if (!blogPostResponse.ok) {
            throw new Error('Failed to fetch blog posts');
        }
        const blogPosts = await blogPostResponse.json();
        //get all author details
        await Promise.all(blogPosts.map(async (blogPost) => {
            const authorResponse = await fetch(`/users/${blogPost.author}`)
            if (!authorResponse.ok){
                throw new Error('Failed to fetch author details');
            }
            const authDate = await authorResponse.json();
            blogPost.authorName = authDate.name;
        }));

        // Get all comment details
        await Promise.all(blogPosts.map(async (blogPost) => {
            for (const comment of blogPost.comments) {
                const userResponse = await fetch(`/users/${comment.user}`);
                if (!userResponse.ok){
                    throw new Error('Failed to fetch user details');
                }
                const userData = await userResponse.json();
                comment.userName = userData.name;
            }
        }));

        displayBlogPost(blogPosts);

        const postBlogForm = document.getElementById('postBlogForm');
        postBlogForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const loggedInUser = getLoggedInUser();
            if (loggedInUser) {
                handlePostBlog(e, loggedInUser);
            } else {
                alert('You need to be logged in to post a blog.');
            }
        });

        blogPosts.forEach(blogPost => {
            const commentButton = document.getElementById(`commentButton-${blogPost._id}`);
            if (commentButton) {
                commentButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    console.log('Comment button clicked for post:', blogPost._id);
                    const loggedInUser = getLoggedInUser();
                    const commentInput = document.getElementById(`commentInput-${blogPost._id}`);

                    if (loggedInUser && commentInput.value.trim() !== '') {
                        await addBlogComment(blogPost._id, commentInput.value);
                        commentInput.value = '';
                        displayBlogPost(blogPosts);
                    }
                });
            }
        });
    }
    catch (error) {
        console.error('Error fetching content', error.message);
    }
});


async function displayBlogPost(blogPosts) {
    const blogPostContainer = document.getElementById('blogPosts');

    let rowContainer = blogPostContainer.querySelector('.row');

    if (!rowContainer) {
        rowContainer = document.createElement('div');
        rowContainer.className = 'row';
        blogPostContainer.appendChild(rowContainer);
    } else {
        rowContainer.innerHTML = '';
    }

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    blogPosts.forEach(blogPost => {

        const cardElement = document.createElement('div');
        cardElement.className = 'card';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const titleElement = document.createElement('h5');
        titleElement.className = 'card-title';
        titleElement.textContent = blogPost.title;
        cardBody.appendChild(titleElement);

        const createdAtDate = new Date(blogPost.createdAt);
        const formattedDate = createdAtDate.toLocaleString();

        const authorElement = document.createElement('p');
        authorElement.className = 'card-text';
        authorElement.textContent = `Author: ${blogPost.authorName} Created: ${formattedDate}`;
        cardBody.appendChild(authorElement);

        const contentElement = document.createElement('p');
        contentElement.className = 'card-text';
        contentElement.textContent = blogPost.content;
        cardBody.appendChild(contentElement);

        const likesElement = document.createElement('span');
        likesElement.className = 'card-text';
        likesElement.textContent = `Likes: ${blogPost.likes}`;




        if (loggedInUser) {

            const likeButton = document.createElement('button');
            likeButton.className = 'btn btn-sm btn-primary ms-2';
            const thumbsUpPostIcon = document.createElement('i');
            thumbsUpPostIcon.className = 'bi bi-hand-thumbs-up';
            likeButton.appendChild(thumbsUpPostIcon);

            likeButton.addEventListener('click', async () => {
                await likeBlogPost(blogPost._id);
                blogPost.likes++;
                likesElement.textContent = `Likes: ${blogPost.likes}`;
            });
            cardBody.appendChild(likesElement);
            cardBody.appendChild(likeButton);

            const commentForm = document.createElement('form');
            commentForm.className = 'mt-3';

            const commentInput = document.createElement('input');
            commentInput.className = 'form-control';
            commentInput.type = 'text';
            commentInput.placeholder = 'Add a comment...';
            commentForm.appendChild(commentInput);

            const commentButton = document.createElement('button');
            commentButton.className = 'btn btn-primary mt-2';
            commentButton.textContent = 'Comment';
            commentButton.addEventListener('click', async (e) => {
                e.preventDefault();

                const content = commentInput.value;

                if (content.trim() !== '') {
                    const updatedPost = await addBlogComment(blogPost._id, content);

                    const postIndex = blogPosts.findIndex(post => post._id === blogPost._id);
                    if (postIndex !== -1) {
                        blogPosts[postIndex] = updatedPost;
                        window.location.reload();
                    }
                }
            });

            commentForm.appendChild(commentButton);
            cardBody.appendChild(commentForm);
        }

        const commentsElement = document.createElement('ul');
        commentsElement.className = 'list-group list-group-flush';
        blogPost.comments.forEach((comment, index) => {
            const commentItem = document.createElement('li');
            commentItem.className = 'list-group-item';

            const commentContent = document.createElement('span');
            commentContent.textContent = `Commenter: ${comment.userName}: ${comment.content} (${comment.likes} Likes)`;
            commentItem.appendChild(commentContent);
            if (loggedInUser) {
                const commentLikeButton = document.createElement('button');
                commentLikeButton.className = 'btn btn-sm btn-primary ms-2';
                const thumbsUpIcon = document.createElement('i');
                thumbsUpIcon.className = 'bi bi-hand-thumbs-up';
                commentLikeButton.appendChild(thumbsUpIcon);
                commentLikeButton.addEventListener('click', async () => {
                    await likeBlogComment(blogPost._id, index);
                    comment.likes++;
                    commentContent.textContent = `Commenter: ${comment.userName}: ${comment.content} (${comment.likes} Likes)`;
                });

                commentItem.appendChild(commentLikeButton);
            }
            commentsElement.appendChild(commentItem);

        });
        cardBody.appendChild(commentsElement);
        cardElement.appendChild(cardBody);
        rowContainer.appendChild(cardElement);
    });
}


async function likeBlogPost(blogId) {
    try {
        const response = await fetch(`/blogs/like/${blogId}`, {
            method: 'PUT'
        });
        if (!response.ok) {
            throw new Error('Like failed');
        }
    } catch (error) {
        console.error('Like Blog Post error:', error);
        alert('Like failed. Please try again.');
    }
}

async function likeBlogComment(blogId, commentIndex) {
    try {
        const response = await fetch(`/blogs/${blogId}/comment/like/${commentIndex}`, {
            method: 'PUT'
        });
        if (!response.ok) {
            throw new Error('Like failed');
        }
    } catch (error) {
        console.error('Like Blog Comment error:', error);
        alert('Like failed. Please try again.');
    }
}


var modal = new bootstrap.Modal(document.getElementById('loginModal'));

function checkLoggedIn() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const postBlogSection = document.getElementById('postBlogSection');

    if (loggedInUser) {
        showLoggedInElements(JSON.parse(loggedInUser));
        postBlogSection.style.display = 'block';
    } else {
        showLoginButton();
        postBlogSection.style.display = 'none';
    }
}


function showLoggedInElements(user) {
    const loggedInContainer = document.getElementById('loggedInContainer');
    loggedInContainer.innerHTML = `
        <div class="alert alert-success mt-3">
            Logged in as ${user.username}
        </div>
        <button id="logOffBtn" class="btn btn-danger">Log off</button>
    `;


    document.getElementById('logOffBtn').addEventListener('click', () => {
        logOff();
    });

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.style.display = 'none';
    }
}

function showLoginButton() {
    const loginBtn = document.createElement('button');
    loginBtn.id = 'loginBtn';
    loginBtn.className = 'btn btn-primary';
    loginBtn.textContent = 'Login';
    loginBtn.setAttribute('data-bs-toggle', 'modal');
    loginBtn.setAttribute('data-bs-target', '#loginModal');

    document.getElementById('loginContainer').appendChild(loginBtn);
}

function logOff() {
    localStorage.removeItem('loggedInUser');
    location.reload();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const user = await response.json();

        localStorage.setItem('loggedInUser', JSON.stringify(user));
        showLoggedInElements(user);
        handleLoginSuccess(user);
        modal.hide();

    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

checkLoggedIn();

async function handlePostBlog(e, loggedInUser) {
    e.preventDefault();

    const blogTitle = document.getElementById('blogTitle').value;
    const blogContent = document.getElementById('blogContent').value;

    const blogData = {
        title: blogTitle,
        content: blogContent,
        author: loggedInUser._id
    };

    try {
        const response = await fetch('/blogs/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(blogData)
        });

        if (!response.ok) {
            throw new Error('Failed to post blog');
        }

        const newBlog = await response.json();
        console.log('New blog posted:', newBlog);

        document.getElementById('blogTitle').value = '';
        document.getElementById('blogContent').value = '';

        location.reload();

    } catch (error) {
        console.error('Post blog error:', error);
        alert('Failed to post blog. Please try again.');
    }
}



function handleLoginSuccess(userData) {
    localStorage.setItem('loggedInUser', JSON.stringify(userData));
    window.location.reload();
}

function getLoggedInUser() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    return loggedInUser ? JSON.parse(loggedInUser) : null;
}


async function addBlogComment(blogId, content) {
    try {
        const loggedInUser = getLoggedInUser();

        if (!loggedInUser) {
            throw new Error('User not logged in');
        }

        const response = await fetch(`/blogs/${blogId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userID: loggedInUser._id,
                content: content
            })
        });

        if (!response.ok) {
            throw new Error('Failed to add comment');
        }

        const updatedBlogPost = await response.json();
        return updatedBlogPost;

    } catch (error) {
        console.error('Error adding comment:', error.message);
        throw error;
    }
}