    // storage.js - Sử dụng Firebase để lưu trữ online
    (function() {
        'use strict';

        // Firebase configuration - ĐÃ SỬA LỖI CÚ PHÁP
        const firebaseConfig = {
            apiKey: "AIzaSyBDx7p6i5EJTRX3RWFO59hUQa9Ko_Sp81U",
            authDomain: "qr-code-love-app.firebaseapp.com",
            projectId: "qr-code-love-app",
            storageBucket: "qr-code-love-app.firebasestorage.app",
            messagingSenderId: "1086860203755",
            appId: "1:1086860203755:web:e2285becc075e2d1c890ae",
            measurementId: "G-CW93VF1TN4"
        };

        // Khởi tạo Firebase
        let app;
        let db;

        try {
            app = firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            // Fallback to localStorage if Firebase fails
            initializeLocalStorageFallback();
        }

        const StorageManager = {
            // Khóa lưu trữ trong localStorage (fallback)
            STORAGE_KEYS: {
                CURRENT_USER_ANSWERS: 'currentUserAnswers',
                ALL_USERS_ANSWERS: 'allUsersAnswers',
                CURRENT_QUESTION: 'currentQuestion',
                TREASURE_OPENED: 'treasureOpened',
                USER_ID: 'userId',
                IS_ADMIN: 'isAdmin'
            },

            // Thông tin admin
            ADMIN_CREDENTIALS: {
                username: 'admin',
                password: '24082007'
            },

            // Nội dung các câu hỏi
            QUESTIONS: {
                1: "Muộn rồi sao chưa ngủ -.-",
                2: "Đói chưa bà?",
                3: "Biết hôm nay là ngày gì không?",
                4: "Biết giờ này là giờ rồi chưaaaaaa?",
                5: "Nè có yêu tui hok?",
                6: "Có muộn phiền, buồn j hok nhắn đây tui đọc",
                7: "Nêu 1 điểm xấu về tớ",
                8: "Nêu 1 điểm tốt về tớ",
                9: "Hiện tại yêu tui bao nhiêu % rùiii?",
                10: "Nêu cảm nhận khi yêu tui 1 tháng"
            },

            // Callback khi dữ liệu thay đổi
            onDataChanged: null,

            // Trạng thái Firebase
            firebaseEnabled: false,

            // Khởi tạo
            init: function() {
                // Khởi tạo userId nếu chưa có
                if (!this.getUserId()) {
                    this.generateUserId();
                }

                // Khởi tạo dữ liệu nếu chưa có
                this.initializeData();

                // Kiểm tra Firebase
                this.firebaseEnabled = !!(db && typeof db.collection === 'function');

                console.log('StorageManager initialized with userId:', this.getUserId());
                console.log('Firebase enabled:', this.firebaseEnabled);

                // Nếu Firebase hoạt động, lắng nghe thay đổi dữ liệu
                if (this.firebaseEnabled) {
                    this.setupFirebaseListener();
                }
            },

            // Khởi tạo dữ liệu
            initializeData: function() {
                // Khởi tạo dữ liệu người dùng hiện tại
                if (!localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER_ANSWERS)) {
                    localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER_ANSWERS, JSON.stringify({}));
                }

                // Khởi tạo dữ liệu tất cả người dùng
                if (!localStorage.getItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS)) {
                    localStorage.setItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS, JSON.stringify({}));
                }

                // Khởi tạo câu hỏi hiện tại
                if (!localStorage.getItem(this.STORAGE_KEYS.CURRENT_QUESTION)) {
                    localStorage.setItem(this.STORAGE_KEYS.CURRENT_QUESTION, '1');
                }

                // Khởi tạo trạng thái hòm châu báu
                if (!localStorage.getItem(this.STORAGE_KEYS.TREASURE_OPENED)) {
                    localStorage.setItem(this.STORAGE_KEYS.TREASURE_OPENED, 'false');
                }
            },

            // Thiết lập listener cho Firebase
            setupFirebaseListener: function() {
                if (!this.firebaseEnabled) return;

                db.collection('users').onSnapshot((snapshot) => {
                    console.log('Firebase data changed');
                    const allUsersData = {};

                    snapshot.forEach((doc) => {
                        allUsersData[doc.id] = doc.data();
                    });

                    // Cập nhật localStorage
                    localStorage.setItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS, JSON.stringify(allUsersData));

                    // Gọi callback nếu có
                    if (this.onDataChanged) {
                        this.onDataChanged(allUsersData);
                    }
                }, (error) => {
                    console.error('Firebase listener error:', error);
                });
            },

            // Tạo userId ngẫu nhiên
            generateUserId: function() {
                const timestamp = Date.now().toString(36);
                const randomStr = Math.random().toString(36).substring(2, 8);
                const userId = `${timestamp}-${randomStr}`;
                localStorage.setItem(this.STORAGE_KEYS.USER_ID, userId);
                return userId;
            },

            // Lấy userId
            getUserId: function() {
                return localStorage.getItem(this.STORAGE_KEYS.USER_ID);
            },

            // Lưu câu trả lời
            saveAnswer: async function(questionNumber, answer) {
                // Kiểm tra dữ liệu đầu vào
                if (!questionNumber || questionNumber < 1 || questionNumber > 10) {
                    throw new Error('Số câu hỏi không hợp lệ');
                }

                if (!answer || answer.trim() === '') {
                    throw new Error('Câu trả lời không được để trống');
                }

                const userId = this.getUserId();
                const timestamp = new Date().toLocaleString('vi-VN');

                // Lưu câu trả lời của người dùng hiện tại
                const currentUserAnswers = this.getCurrentUserAnswers();
                currentUserAnswers[questionNumber] = answer.trim();
                localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER_ANSWERS, JSON.stringify(currentUserAnswers));

                try {
                    // Đồng bộ với Firebase
                    if (this.firebaseEnabled) {
                        await db.collection('users').doc(userId).set({
                            userId: userId,
                            timestamp: timestamp,
                            answers: currentUserAnswers,
                            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });

                        console.log('Data saved to Firebase successfully');
                    } else {
                        // Fallback: đồng bộ với localStorage tổng hợp
                        this.syncToAllUsersAnswers();
                    }

                    // Thông báo dữ liệu thay đổi
                    if (this.onDataChanged) {
                        this.onDataChanged(this.getAllUsersAnswers());
                    }

                    return {
                        success: true,
                        questionNumber: questionNumber,
                        answer: answer,
                        synced: this.firebaseEnabled
                    };

                } catch (error) {
                    console.error('Error saving to Firebase:', error);
                    // Fallback to localStorage
                    this.syncToAllUsersAnswers();

                    return {
                        success: true,
                        questionNumber: questionNumber,
                        answer: answer,
                        synced: false,
                        error: error.message
                    };
                }
            },

            // Lấy câu trả lời của người dùng hiện tại
            getCurrentUserAnswers: function() {
                const answers = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER_ANSWERS);
                return answers ? JSON.parse(answers) : {};
            },

            // Lấy số câu đã trả lời
            getAnsweredCount: function() {
                const answers = this.getCurrentUserAnswers();
                return Object.keys(answers).length;
            },

            // Lấy phần trăm tiến độ
            getProgressPercentage: function() {
                return (this.getAnsweredCount() / 10) * 100;
            },

            // Lấy câu hỏi hiện tại
            getCurrentQuestion: function() {
                const currentQuestion = localStorage.getItem(this.STORAGE_KEYS.CURRENT_QUESTION);
                return currentQuestion ? parseInt(currentQuestion) : 1;
            },

            // Đặt câu hỏi hiện tại
            setCurrentQuestion: function(questionNumber) {
                if (questionNumber >= 1 && questionNumber <= 10) {
                    localStorage.setItem(this.STORAGE_KEYS.CURRENT_QUESTION, questionNumber.toString());
                    return true;
                }
                return false;
            },

            // Kiểm tra xem hòm châu báu đã mở chưa
            isTreasureOpened: function() {
                return localStorage.getItem(this.STORAGE_KEYS.TREASURE_OPENED) === 'true';
            },

            // Mở hòm châu báu
            openTreasure: function() {
                localStorage.setItem(this.STORAGE_KEYS.TREASURE_OPENED, 'true');
                return true;
            },

            // Đồng bộ câu trả lời của người dùng hiện tại với dữ liệu tổng hợp (fallback)
            syncToAllUsersAnswers: function() {
                const userId = this.getUserId();
                const currentUserAnswers = this.getCurrentUserAnswers();

                if (Object.keys(currentUserAnswers).length === 0) {
                    return false;
                }

                // Lấy dữ liệu tất cả người dùng
                const allUsersAnswers = this.getAllUsersAnswers();

                // Cập nhật hoặc thêm mới dữ liệu người dùng
                allUsersAnswers[userId] = {
                    userId: userId,
                    timestamp: new Date().toLocaleString('vi-VN'),
                    answers: currentUserAnswers
                };

                // Lưu lại
                localStorage.setItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS, JSON.stringify(allUsersAnswers));

                return true;
            },

            // Lấy tất cả câu trả lời của mọi người
            getAllUsersAnswers: function() {
                // Ưu tiên lấy từ Firebase, nếu không có thì lấy từ localStorage
                const allUsersAnswers = localStorage.getItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS);
                return allUsersAnswers ? JSON.parse(allUsersAnswers) : {};
            },

            // Xóa một câu trả lời cụ thể của người dùng
            deleteAnswer: async function(userId, questionNumber) {
                try {
                    if (this.firebaseEnabled) {
                        const userRef = db.collection('users').doc(userId);
                        const userDoc = await userRef.get();

                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            if (userData.answers && userData.answers[questionNumber]) {
                                delete userData.answers[questionNumber];

                                // Nếu không còn câu trả lời nào, xóa user
                                if (Object.keys(userData.answers).length === 0) {
                                    await userRef.delete();
                                } else {
                                    await userRef.set(userData);
                                }

                                return true;
                            }
                        }
                    } else {
                        // Fallback to localStorage
                        const allUsersAnswers = this.getAllUsersAnswers();

                        if (allUsersAnswers[userId] && allUsersAnswers[userId].answers[questionNumber]) {
                            delete allUsersAnswers[userId].answers[questionNumber];

                            // Nếu người dùng không còn câu trả lời nào, xóa luôn người dùng
                            if (Object.keys(allUsersAnswers[userId].answers).length === 0) {
                                delete allUsersAnswers[userId];
                            }

                            localStorage.setItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS, JSON.stringify(allUsersAnswers));

                            // Thông báo dữ liệu thay đổi
                            if (this.onDataChanged) {
                                this.onDataChanged(allUsersAnswers);
                            }

                            return true;
                        }
                    }

                    return false;

                } catch (error) {
                    console.error('Error deleting answer:', error);
                    return false;
                }
            },

            // Xóa tất cả câu trả lời của một người dùng
            deleteUserAnswers: async function(userId) {
                try {
                    if (this.firebaseEnabled) {
                        await db.collection('users').doc(userId).delete();
                        return true;
                    } else {
                        // Fallback to localStorage
                        const allUsersAnswers = this.getAllUsersAnswers();

                        if (allUsersAnswers[userId]) {
                            delete allUsersAnswers[userId];
                            localStorage.setItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS, JSON.stringify(allUsersAnswers));

                            // Thông báo dữ liệu thay đổi
                            if (this.onDataChanged) {
                                this.onDataChanged(allUsersAnswers);
                            }

                            return true;
                        }

                        return false;
                    }
                } catch (error) {
                    console.error('Error deleting user answers:', error);
                    return false;
                }
            },

            // Xóa tất cả câu trả lời của mọi người
            deleteAllAnswers: async function() {
                try {
                    if (this.firebaseEnabled) {
                        const usersSnapshot = await db.collection('users').get();
                        const batch = db.batch();

                        usersSnapshot.forEach((doc) => {
                            batch.delete(doc.ref);
                        });

                        await batch.commit();
                        return true;
                    } else {
                        // Fallback to localStorage
                        localStorage.setItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS, JSON.stringify({}));

                        // Thông báo dữ liệu thay đổi
                        if (this.onDataChanged) {
                            this.onDataChanged({});
                        }

                        return true;
                    }
                } catch (error) {
                    console.error('Error deleting all answers:', error);
                    return false;
                }
            },

            // Đăng nhập admin
            loginAdmin: function(username, password) {
                if (username === this.ADMIN_CREDENTIALS.username && 
                    password === this.ADMIN_CREDENTIALS.password) {
                    localStorage.setItem(this.STORAGE_KEYS.IS_ADMIN, 'true');
                    return true;
                }
                return false;
            },

            // Kiểm tra có phải admin không
            isAdmin: function() {
                return localStorage.getItem(this.STORAGE_KEYS.IS_ADMIN) === 'true';
            },

            // Đăng xuất admin
            logoutAdmin: function() {
                localStorage.setItem(this.STORAGE_KEYS.IS_ADMIN, 'false');
            },

            // Thiết lập callback khi dữ liệu thay đổi
            setOnDataChanged: function(callback) {
                this.onDataChanged = callback;
            },

            // Tải dữ liệu từ Firebase
            loadFromCentralStorage: async function() {
                try {
                    if (this.firebaseEnabled) {
                        const snapshot = await db.collection('users').get();
                        const allUsersData = {};

                        snapshot.forEach((doc) => {
                            allUsersData[doc.id] = doc.data();
                        });

                        // Cập nhật localStorage
                        localStorage.setItem(this.STORAGE_KEYS.ALL_USERS_ANSWERS, JSON.stringify(allUsersData));

                        return allUsersData;
                    } else {
                        // Fallback to localStorage
                        return this.getAllUsersAnswers();
                    }
                } catch (error) {
                    console.error('Error loading from central storage:', error);
                    return this.getAllUsersAnswers();
                }
            },

            // Lấy nội dung câu hỏi
            getQuestionText: function(questionNumber) {
                return this.QUESTIONS[questionNumber] || `Câu hỏi ${questionNumber}`;
            },

            // Kiểm tra trạng thái Firebase
            isFirebaseEnabled: function() {
                return this.firebaseEnabled;
            }
        };

        // Hàm fallback nếu Firebase không khởi tạo được
        function initializeLocalStorageFallback() {
            console.warn('Firebase not available, using localStorage fallback');

            // Tạo đối tượng Firebase giả để tránh lỗi
            window.firebase = {
                initializeApp: function() { return {}; },
                firestore: function() { 
                    return {
                        collection: function() {
                            return {
                                doc: function() {
                                    return {
                                        set: function() { return Promise.resolve(); },
                                        get: function() { return Promise.resolve({ exists: false }); },
                                        delete: function() { return Promise.resolve(); }
                                    };
                                },
                                get: function() { 
                                    return Promise.resolve({
                                        forEach: function() {}
                                    }); 
                                },
                                onSnapshot: function() {}
                            };
                        },
                        batch: function() {
                            return {
                                delete: function() {},
                                commit: function() { return Promise.resolve(); }
                            };
                        },
                        FieldValue: {
                            serverTimestamp: function() { return new Date(); }
                        }
                    };
                }
            };
        }

        // Khởi tạo StorageManager ngay khi tải
        StorageManager.init();

        // Xuất đối tượng StorageManager ra toàn cục
        window.storageManager = StorageManager;

        console.log('Storage.js loaded successfully with Firebase support');
    })();