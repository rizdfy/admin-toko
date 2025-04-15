import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// 🔧 Fungsi untuk ambil nama dari email
function getUserNameFromEmail(email) {
    return email.split('@')[0];
}

// 🔥 Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCEng2Zpss0ATs3wkGs_vgy1YViSzkf07E",
    authDomain: "toko-eaa04.firebaseapp.com",
    projectId: "toko-eaa04",
    storageBucket: "toko-eaa04.appspot.com",
    messagingSenderId: "761393852069",
    appId: "1:761393852069:web:c9250f50038028d255e74c"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
let editId = null;

// Login dengan Google
document.getElementById("google-login-btn").addEventListener("click", () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;

            document.getElementById("user-email").textContent = getUserNameFromEmail(user.email);

            const userPhoto = document.getElementById("user-photo");
            if (user.photoURL) {
                userPhoto.src = user.photoURL;
                userPhoto.style.display = "block";
            }

            document.getElementById("login-form").style.display = "none";
            document.getElementById("dashboard-container").style.display = "block";
        });
});

// Status login
onAuthStateChanged(auth, (user) => {
    if (user) {
        const username = getUserNameFromEmail(user.email);
        document.getElementById("user-email").textContent = username;

        const userPhoto = document.getElementById("user-photo");
        const photoUrl = user.photoURL || "https://i.postimg.cc/Prtd1GD9/635bd3ab46e8e675e7a840481d0eef50.jpg";
        userPhoto.src = photoUrl;
        userPhoto.style.display = "block";

        document.getElementById("login-form").style.display = "none";
        document.getElementById("signup-form").style.display = "none";
        document.getElementById("dashboard-container").style.display = "block";
    } else {
        document.getElementById("user-photo").style.display = "block";
        document.getElementById("user-photo").src = "https://i.postimg.cc/Prtd1GD9/635bd3ab46e8e675e7a840481d0eef50.jpg";
        document.getElementById("dashboard-container").style.display = "none";
        document.getElementById("login-form").style.display = "block";
        document.getElementById("signup-form").style.display = "none";
    }

    toggleView(user);
});

function toggleView(user) {
    if (user) {
        document.getElementById("login-form").style.display = "none";
        document.getElementById("signup-form").style.display = "none";
        document.getElementById("dashboard-container").style.display = "block";
        document.getElementById("user-email").innerText = getUserNameFromEmail(user.email);
        loadBarang();
    } else {
        document.getElementById("login-form").style.display = "block";
        document.getElementById("signup-form").style.display = "none";
        document.getElementById("dashboard-container").style.display = "none";
    }
}

function showAlert(message, type = "success") {
    const alertBox = document.getElementById("custom-alert");
    alertBox.innerText = message;
    alertBox.className = `alert ${type} show`;
    setTimeout(() => {
        alertBox.classList.remove("show");
    }, 3000);
}

// Tombol SignUp
document.getElementById("signup-btn").addEventListener("click", async () => {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    if (!email || !password) {
        showAlert("Email dan password harus diisi!");
        return;
    }
    try {
        await signOut(auth);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        showAlert("Pendaftaran berhasil!");

        document.getElementById("user-email").textContent = getUserNameFromEmail(user.email);
        const userPhoto = document.getElementById("user-photo");
        userPhoto.src = "https://i.pinimg.com/564x/13/3b/26/133b26f2b5f64b63fd35cfe1e09d6e08.jpg";
        userPhoto.style.display = "block";

        document.getElementById("signup-form").style.display = "none";
        document.getElementById("dashboard-container").style.display = "block";
    } catch (error) {
        showAlert("Pendaftaran gagal: " + error.message, "error");
    }
});

// Tombol Login
document.getElementById("login-btn").addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
        .then(() => showAlert("Login berhasil!"))
        .catch(error => showAlert("Login gagal: " + error.message, "error"));
});

// Tombol Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth);
});

// Fungsi load data barang
async function loadBarang() {
    const querySnapshot = await getDocs(collection(db, "barang"));
    const table = document.getElementById("barangList");
    const searchInput = document.getElementById("searchBarang");
    const searchValue = searchInput?.value.trim().toLowerCase() || "";
    table.innerHTML = "";

    const dataList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        editedAt: docSnap.data().editedAt ? new Date(docSnap.data().editedAt.toDate()).toLocaleDateString("id-ID") : "-"
    }));

    const filtered = dataList.filter(item =>
        item.nama?.toLowerCase().includes(searchValue)
    );

    if (filtered.length === 0) {
        table.innerHTML = "<tr><td colspan='5'>Barang tidak ditemukan</td></tr>";
    } else {
        filtered.forEach((item, index) => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.nama}</td>
                <td>Rp ${item.harga}</td>
                <td>${item.editedAt}</td>
                <td>
                    <button onclick="editBarang('${item.id}', '${item.nama}', '${item.harga}')">Edit</button>
                    <button onclick="hapusBarang('${item.id}')">Hapus</button>
                </td>`;
        });
    }
}
window.loadBarang = loadBarang;

// Menampilkan perbedaan harga
let priceDiffTimeout;
function updatePriceDiff(nama, hargaLama, hargaBaru) {
    const container = document.getElementById("price-diff-container");
    document.getElementById("diff-nama").textContent = nama;
    document.getElementById("harga-lama").textContent = hargaLama;
    document.getElementById("harga-baru").textContent = hargaBaru;
    document.getElementById("selisih-harga").textContent = hargaBaru - hargaLama;

    container.style.display = "block";
    clearTimeout(priceDiffTimeout);
    priceDiffTimeout = setTimeout(() => {
        container.style.display = "none";
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector('.close-price-diff');
    const priceDiffContainer = document.getElementById('price-diff-container');
    closeBtn.addEventListener('click', () => {
        priceDiffContainer.style.display = 'none';
        clearTimeout(priceDiffTimeout);
    });
});

window.editBarang = function(id, nama, harga) {
    document.getElementById("namaBarang").value = nama;
    document.getElementById("hargaBarang").value = harga;
    editId = id;
    document.getElementById("hargaBarang").setAttribute("data-old-harga", harga);
    const btn = document.getElementById("btnTambah");
    btn.textContent = "Simpan Perubahan";
};

window.hapusBarang = async function(id) {
    if (confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
        await deleteDoc(doc(db, "barang", id));
        showAlert("Barang berhasil dihapus!");
        loadBarang();
    }
};

document.getElementById("btnTambah").addEventListener("click", async () => {
    const nama = document.getElementById("namaBarang").value;
    const harga = document.getElementById("hargaBarang").value;

    if (!nama || !harga) {
        showAlert("Nama dan harga barang harus diisi!");
        return;
    }

    const btn = document.getElementById("btnTambah");

    if (editId) {
        const oldHarga = document.getElementById("hargaBarang").getAttribute("data-old-harga");

        if (oldHarga !== harga) {
            updatePriceDiff(nama, oldHarga, harga);
        }

        await updateDoc(doc(db, "barang", editId), {
            nama,
            harga,
            editedAt: new Date()
        });

        showAlert("Barang berhasil diperbarui!");
        editId = null;
        btn.textContent = "Tambah Barang";
        document.getElementById("hargaBarang").removeAttribute("data-old-harga");
    } else {
        await addDoc(collection(db, "barang"), { nama, harga });
        showAlert(`${nama} berhasil ditambahkan!`);

    }

    document.getElementById("namaBarang").value = "";
    document.getElementById("hargaBarang").value = "";
    loadBarang();
});

// Tampilkan login/signup
function showLogin() {
    document.getElementById("login-form").style.display = "block";
    document.getElementById("signup-form").style.display = "none";
}

function showSignup() {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("signup-form").style.display = "block";
}

document.getElementById("show-signup").addEventListener("click", (e) => {
    e.preventDefault();
    showSignup();
});

document.getElementById("show-login").addEventListener("click", (e) => {
    e.preventDefault();
    showLogin();
});

showLogin();
