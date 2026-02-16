/**
 * Room Type Edit Modal - Admin Panel
 * External JS file to prevent IDE formatter from corrupting string literals
 */

function openEditModal(type) {
    var modal = document.getElementById("editModalBg");
    var form = document.getElementById("editForm");
    form.action = "/admin/edit-room-type/" + type.id;
    document.getElementById("editName").value = type.name || "";
    document.getElementById("editPrice").value = type.price || "";
    document.getElementById("editDescription").value = type.description || "";
    document.getElementById("editAmenities").value = (type.amenities || []).join(", ");
    document.getElementById("editImagePreview").src = type.image || "";
    document.getElementById("editRooms").value = (type.assignedRooms || []).join(", ");
    var cbs = document.querySelectorAll(".edit-floor-cb");
    for (var i = 0; i < cbs.length; i++) {
        var floorNum = parseInt(cbs[i].dataset.floor);
        cbs[i].checked = (type.assignedFloors || []).indexOf(floorNum) !== -1;
    }
    modal.classList.add("active");
}

function closeEditModal() {
    document.getElementById("editModalBg").classList.remove("active");
}

document.addEventListener("DOMContentLoaded", function () {
    var modalBg = document.getElementById("editModalBg");
    if (modalBg) {
        modalBg.addEventListener("click", function (ev) {
            if (ev.target === modalBg) {
                closeEditModal();
            }
        });
    }
    document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") {
            closeEditModal();
        }
    });
});
