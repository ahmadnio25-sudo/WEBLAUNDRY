
    // HARGA LAYANAN LAUNDRY
    const prices = {
        Reguler: 7000,
        Express: 12000,
        Setrika: 5000,
        Komplit: 10000
    };

    // MENGAMBIL ELEMEN HTML
    const form = document.getElementById("laundryForm");
    const customerName = document.getElementById("customerName");
    const phone = document.getElementById("phone");
    const service = document.getElementById("service");
    const weight = document.getElementById("weight");
    const date = document.getElementById("date");
    const payment = document.getElementById("payment");
    const pricePreview = document.getElementById("pricePreview");

    const transactionTable = document.getElementById("transactionTable");
    const searchInput = document.getElementById("searchInput");
    const filterStatus = document.getElementById("filterStatus");

    // FORMAT RUPIAH
    function rupiah(number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(number);
    }

    // TANGGAL HARI INI
    const today = new Date();
    const localDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];

    date.value = localDate;
    date.max = localDate;

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    // MENGAMBIL DATA DARI LOCAL STORAGE
    let transactions = JSON.parse(
        localStorage.getItem("laundryTransactions")
    ) || [];

    // MENYIMPAN DATA
    function saveData() {
        localStorage.setItem(
            "laundryTransactions",
            JSON.stringify(transactions)
        );
    }

    // MENGHITUNG TOTAL HARGA
    function calculatePrice() {
        const selectedService = service.value;
        const laundryWeight = parseFloat(weight.value) || 0;

        const total = prices[selectedService] * laundryWeight;

        pricePreview.textContent = rupiah(total);
    }

    service.addEventListener("change", calculatePrice);
    weight.addEventListener("input", calculatePrice);

    // RESET FORM
    form.addEventListener("reset", function () {
        setTimeout(() => {
            date.value = localDate;
            pricePreview.textContent = rupiah(0);
        }, 0);
    });

    // MENAMBAHKAN TRANSAKSI
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = customerName.value.trim();
        const phoneNumber = phone.value.trim();
        const selectedService = service.value;
        const laundryWeight = parseFloat(weight.value);
        const selectedDate = date.value;

        if (!name || !phoneNumber || !selectedDate) {
            alert("Semua data pelanggan harus diisi!");
            return;
        }

        if (!/^[0-9+\-\s]{8,20}$/.test(phoneNumber)) {
            alert("Nomor telepon tidak valid!");
            return;
        }

        if (!Number.isFinite(laundryWeight) || laundryWeight <= 0) {
            alert("Berat laundry harus lebih dari 0 KG!");
            return;
        }

        if (selectedDate > localDate) {
            alert("Tanggal masuk tidak boleh melebihi hari ini!");
            return;
        }

        const totalPrice =
            prices[selectedService] * laundryWeight;

        const transaction = {
            id: "LD" + Date.now().toString().slice(-8),
            name: name,
            phone: phoneNumber,
            service: selectedService,
            weight: laundryWeight,
            total: totalPrice,
            date: selectedDate,
            payment: payment.value,
            status: "Diproses"
        };

        transactions.unshift(transaction);

        saveData();
        renderTransactions();
        updateDashboard();

        form.reset();

        alert("Transaksi berhasil ditambahkan!");

        document.getElementById("transaksi").scrollIntoView({
            behavior: "smooth"
        });
    });

    // MENAMPILKAN TRANSAKSI
    function renderTransactions() {

        transactionTable.innerHTML = "";

        const keyword = searchInput.value.toLowerCase();
        const selectedStatus = filterStatus.value;

        const filteredTransactions = transactions.filter(item => {

            const matchName =
                item.name.toLowerCase().includes(keyword) ||
                item.id.toLowerCase().includes(keyword);

            const matchStatus =
                selectedStatus === "Semua" ||
                item.status === selectedStatus;

            return matchName && matchStatus;
        });

        document.getElementById("emptyMessage").style.display =
            filteredTransactions.length === 0 ? "block" : "none";

        document.getElementById("transactionCount").textContent =
            filteredTransactions.length + " Transaksi";

        filteredTransactions.forEach((item, index) => {

            const row = document.createElement("tr");

            const cells = [
                index + 1,
                item.id,
                item.name,
                item.service,
                item.weight + " KG",
                rupiah(item.total),
                item.payment,
                item.date
            ];

            cells.forEach(value => {
                const td = document.createElement("td");
                td.textContent = value;
                row.appendChild(td);
            });

            // STATUS PESANAN
            const statusCell = document.createElement("td");

            const statusSelect = document.createElement("select");
            statusSelect.className = "status-select";

            ["Diproses", "Selesai", "Diambil"].forEach(status => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;

                if (item.status === status) {
                    option.selected = true;
                }

                statusSelect.appendChild(option);
            });

            statusSelect.addEventListener("change", function () {
                updateStatus(item.id, this.value);
            });

            statusCell.appendChild(statusSelect);
            row.appendChild(statusCell);

            // TOMBOL HAPUS
            const actionCell = document.createElement("td");

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Hapus";
            deleteButton.className = "btn-delete";

            deleteButton.addEventListener("click", function () {
                deleteTransaction(item.id);
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            transactionTable.appendChild(row);
        });
    }

    // MENGUBAH STATUS
    function updateStatus(id, newStatus) {

        const transaction = transactions.find(
            item => item.id === id
        );

        if (transaction) {
            transaction.status = newStatus;

            saveData();
            renderTransactions();
            updateDashboard();
        }
    }

    // MENGHAPUS TRANSAKSI
    function deleteTransaction(id) {

        const confirmation = confirm(
            "Apakah Anda yakin ingin menghapus transaksi ini?"
        );

        if (confirmation) {

            transactions = transactions.filter(
                item => item.id !== id
            );

            saveData();
            renderTransactions();
            updateDashboard();

            alert("Transaksi berhasil dihapus!");
        }
    }

    // UPDATE DASHBOARD
    function updateDashboard() {

        const totalIncome = transactions.reduce(
            (sum, item) => sum + item.total,
            0
        );

        const totalOrders = transactions.length;

        const processing = transactions.filter(
            item => item.status === "Diproses"
        ).length;

        const completed = transactions.filter(
            item => item.status === "Selesai" ||
                    item.status === "Diambil"
        ).length;

        document.getElementById("totalIncome").textContent =
            rupiah(totalIncome);

        document.getElementById("totalOrders").textContent =
            totalOrders;

        document.getElementById("processingOrders").textContent =
            processing;

        document.getElementById("completedOrders").textContent =
            completed;
    }

    // FITUR PENCARIAN
    searchInput.addEventListener("input", renderTransactions);

    // FILTER STATUS
    filterStatus.addEventListener("change", renderTransactions);

    // MENU SIDEBAR AKTIF
    document.querySelectorAll(".menu").forEach(menu => {

        menu.addEventListener("click", function () {

            document.querySelectorAll(".menu").forEach(item => {
                item.classList.remove("active");
            });

            this.classList.add("active");
        });
    });

    // MENAMPILKAN DATA SAAT HALAMAN DIBUKA
    renderTransactions();
    updateDashboard();
