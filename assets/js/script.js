
$(document).ready(() => {

    const getDeviceType = () => {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return "tablet";
        }
        if (
            /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
                ua
            )
        ) {
            return "mobile";
        }
        return "desktop";
    };

    if (getDeviceType() != "desktop") {
        $('#pincode').attr('type', 'number');
    } else {
        $('#pincode').attr('type', 'text');
    }

    let pincodes = [];

    geocodesLocalStr = JSON.parse(localStorage.getItem('geocode'));


    if (geocodesLocalStr !== null) {

        geocodesLocalStr.forEach(element => {
            pincodes.push(element.pincode);
        });
    }
    autocomplete(document.getElementById("pincode"), pincodes);



    var d = new Date();
    d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    $('#datepicker').datepicker({
        format: 'dd-mm-yyyy',
        startDate: '-0d',
        endDate: '+7d',
        autoclose: true
    });

    $('#datepicker').datepicker('setDate', "+1d");

    $('#searchCenterForm').on('submit', function (e) {
        alert_err = true;
        e.preventDefault();

        $("#showCenter").html("");
        $("#pincode").attr("disabled", "disabled");
        $("#searchCenterBtn").hide();
        $("#loader").html(`
            <div class="lds-ellipsis"><div></div><div></div><div></div>
        `);
        $(".skeltone").css({ "display": "block" });

        let pincode = $("#pincode").val();
        if (pincode == '') {
            $("#searchCenterBtn").show();
            $("#loader").html("");
            $(".skeltone").css({ "display": "none" });
            $("#pincode").removeAttr("disabled");
            $("#pincode").focus();
            alert("Please enter a pincode");
        } else if (pincode.length != 6) {
            $("#searchCenterBtn").show();
            $("#loader").html("");
            $(".skeltone").css({ "display": "none" });
            $("#pincode").removeAttr("disabled");
            $("#pincode").focus();
            alert("Please enter a valid pincode");
        } else {
            // let url1 = "https://api.data.gov.in/resource/5c2f62fe-5afa-4119-a499-fec9d604d5bd?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json&offset=0&limit=10&filters[pincode]=" + pincode;
            let url1 = "https://api.opencagedata.com/geocode/v1/json?key=0af901bac7514866ab72750a16e7f432&q=" + pincode + ",+India&pretty=1";

            let latlong = search_data_api(url1, pincode);
            latlong.then(data => {

                let url2 = "https://cdn-api.co-vin.in/api/v2/appointment/centers/public/findByLatLong?lat=" + data.latitude + "&long=" + data.longitude;
                fetch(url2)
                    .then(res => res.json())
                    .then(data => {

                        $("#searchCenterBtn").show();
                        $("#loader").html("");
                        $(".skeltone").css({ "display": "none" });
                        $("#pincode").removeAttr("disabled");

                        const centers = data.centers;
                        let err = 0;

                        centers.sort((a, b) => {
                            return a.name.toUpperCase().localeCompare(b.name.toUpperCase())
                        })

                        if (centers.length > 0) {
                            centers.forEach(center => {
                                if (center.pincode == pincode) {
                                    $("#showCenter").append(`
                                        <a href="javascript:void(0);" style="display:flex; width:auto; align-items:center;
                                        border: 1px solid #ced4da; border-radius: .25rem;"
                                            onclick="select_center(${center.center_id},'${center.name}','${center.location}, ${center.district_name}, ${center.state_name}, ${center.pincode}','${pincode}')">
                                            <div style="width:90%" class="p-2">
                                            <p class="m-0" style="font-weight: 500;">
                                                ${center.name}
                                            </p>
                                            <p class="m-0 text-muted" style="font-size: 14px;">
                                                ${center.location}, ${center.district_name}, ${center.state_name}, ${center.pincode}
                                            </p>
                                            </div>
                                            <div style="font-size: 42px;width: 50px;text-align: center;font-weight: 200;
                                                    color: #212529;top: -4px;position: relative;">&#8250;</div>
                                        </a>
                                    `);

                                } else {
                                    err = err + 1;
                                }
                            });
                        } else {
                            $("#showCenter").html(`
                                    <div style="border: 1px solid #ced4da; border-radius: .25rem;" class="p-2">
                                        <p class="m-0 text-danger text-center">
                                        No vaccination center found!
                                        </p>
                                    </div>
                                `);
                        }

                        if (err == centers.length) {
                            $("#showCenter").html(`
                                    <div style="border: 1px solid #ced4da; border-radius: .25rem;" class="p-2">
                                        <p class="m-0 text-danger text-center">
                                        No vaccination center found!
                                        </p>
                                    </div>
                                `);
                        }
                    })
                    .catch(err => {
                        if (alert_err) {
                            if (!navigator.onLine) {
                                alert("Looks like you are out of internet");
                                $("#searchCenterBtn").show();
                                $("#loader").html("");
                                $(".skeltone").css({ "display": "none" });
                                $("#pincode").removeAttr("disabled");
                                $("#pincode").focus();
                            }
                        }
                    });

            });
        }
    });


});


let alert_err = true;

const search_data_api = async function (url, pincode) {
    let latitude = "";
    let longitude = "";
    let pincodes = [];
    let notexistPin = 0;
    let geocodeLength = 0;

    geocode = JSON.parse(localStorage.getItem('geocode'));

    if (geocode !== null) {

        geocodeLength = geocode.length;
        geocode.forEach(element => {

            if (element.pincode == pincode) {
                latitude = element.latitude;
                longitude = element.longitude;
            } else {
                notexistPin = notexistPin + 1;
            }
        });
    }


    if (geocodeLength == notexistPin || geocodeLength == 0) {
        try {
            if (pincode == "741126") {
                latitude = 23.62;
                longitude = 88.39;
            } else {
                const response = await fetch(url);
                const data = await response.json();
                const records = data.results;

                latitude = records[0].geometry.lat.toFixed(2);
                longitude = records[0].geometry.lng.toFixed(2);
            }

            if (geocodeLength > 0) {
                geocode.push(
                    {
                        "pincode": pincode,
                        "latitude": latitude,
                        "longitude": longitude,
                    }
                );
            } else {
                geocode = [
                    {
                        "pincode": pincode,
                        "latitude": latitude,
                        "longitude": longitude,
                    }
                ];
            }

            geocode.sort((a, b) => {
                return parseInt(a.pincode) - parseInt(b.pincode);
            });
            localStorage.setItem('geocode', JSON.stringify(geocode));

            geocode.forEach(element => {
                pincodes.push(element.pincode);
            });
            autocomplete(document.getElementById("pincode"), pincodes);

        } catch (e) {
            if (alert_err) {
                if (!navigator.onLine) {
                    alert("Looks like you are out of internet");
                    $("#searchCenterBtn").show();
                    $("#loader").html("");
                    $(".skeltone").css({ "display": "none" });
                    $("#pincode").removeAttr("disabled");
                    $("#pincode").focus();
                }
                alert_err = false;
            }
        }
    }

    return { "latitude": latitude, "longitude": longitude };

}


function select_center(center_id, name, address, pincode) {
    $("#showFormInput").hide();
    $('#availablity').css("display", "none");
    $("#selected_center").fadeIn();
    $('.selected_center_name').html(name);
    $('#hidden_selected_center_name').val(name);
    $('.selected_center_address').html(address);
    $('#hidden_pincode').val(pincode);
    $('#stopAlertBtn').css("display", "none");
    document.title = name;
}

let title = document.title;
function pagetitle() {
    return title;
}

function select_center_page_back() {
    $("#showFormInput").fadeIn();
    $("#selected_center").hide();
    $('.select_dose').removeAttr("disabled");
    $('.enable_alert_btn').css("display", "inline-block");
    $('.availablity_loader').css("display", "none");
    $('#availablity').css("display", "none");
    $('#selectCenteForm').trigger("reset");
    $('#datepicker').datepicker('setDate', "+1d");
    $('#stopAlertBtn').css("display", "none");
    $('#show_vaccine').html('');
    $('#show_timming').html('');
    $('#show_vacc_and_time').hide();
    document.title = pagetitle();
}



function enable_alert() {
    var i = true;
    var j = true;
    var stop = true;

    let name = $("#hidden_selected_center_name").val();
    let dose = $('.select_dose').val();
    let date = $('#input_date').val();
    let pincode = $('#pincode').val();
    let green = "#00FF00";
    let info = "#dcdcff";
    let red = "#ffa3a3";


    $('.enable_alert_btn').css("display", "none");
    $('.select_dose').attr("disabled", "disabled");
    $('#input_date').attr("disabled", "disabled");
    $('#input_date').removeClass("bg-white");
    $('#calendar_icon').removeClass("bg-white");
    $('.availablity_loader').css("display", "block");
    $('#availablity').css("display", "none");
    $('#stopAlertBtn').css("display", "none");
    $('#availablity h5').html("");
    $("#backBtn").css("display", "none");
    $('#availablity div').css("background", "none");





    const url3 =
        "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=" + pincode + "&date=" + date;

    findByPin(url3);

    let interval = setInterval(() => {
        findByPin(url3);
    }, 200);


    var controller = new AbortController();
    var signal = controller.signal;
    var alert_err_findByPin = true;

    async function findByPin(url3) {

        try {
            const response = await fetch(url3, { 'cache': 'no-cache', signal });
            const data = await response.json();

            $('.availablity_loader').css("display", "none");
            $('#availablity').css("display", "block");
            $('#stopAlertBtn').show();


            $("#stopAlertBtn").click(() => {

                // stop = false;
                $("#stopAlertBtn").css("display", "none");
                $('.enable_alert_btn').css("display", "inline-block");
                $('.select_dose').removeAttr("disabled");
                $('#input_date').removeAttr("disabled");
                $('#input_date').addClass("bg-white");
                $('#calendar_icon').addClass("bg-white");
                $("#backBtn").show();
                $('#availablity').css("display", "none");
                $('#availablity div').css("background", "none");
                $('#availablity h5').html("");
                clearInterval(interval);
                controller.abort();

            });

            let err = 0;


            if (data.sessions.length > 0) {
                data.sessions.forEach((center) => {

                    if (center.name.toUpperCase() == name.toUpperCase()) {

                        if (i) {
                            $('#show_vacc_and_time').fadeIn();
                            let vaccine_html = ` ${center.vaccine}  <span class="badge bg-info text-black" style="letter-spacing:1.3px"> ${center.fee_type.toUpperCase()} </span`;

                            let timmig_html = center.slots[0];

                            for (inc = 1; inc < center.slots.length; inc++) {
                                timmig_html = `${timmig_html}, ${center.slots[inc]}`;
                            }

                            $('#show_vaccine').html(vaccine_html);
                            $('#show_timming').html(timmig_html);
                        }

                        if (dose == "dose1") {
                            if (center.available_capacity_dose1 > 0) {

                                $('#availablity div').css("background", green);
                                $('#availablity h5').html(`${center.available_capacity_dose1} Slots`);
                                document.title = ' (' + center.available_capacity_dose1 + ') ' + center.name.substr(0, 20);

                                if (i) {
                                    j = true;
                                    $("#audio")[0].play();
                                    setTimeout(() => {
                                        $("#audio_avail")[0].play();
                                    }, 1300);
                                    i = false;
                                }
                            } else {
                                $('#availablity div').css("background", red);
                                $('#availablity h5').html("FULLY BOOKED!");
                                document.title = center.name;

                                if (j) {
                                    i = true;
                                    let audio_text_booked =
                                        document.getElementById("audio_text_booked");
                                    audio_text_booked.volume = 0.6;
                                    audio_text_booked.play();
                                    setTimeout(() => {
                                        $("#audio_booked")[0].play();
                                    }, 1300);
                                    j = false;
                                }
                            }
                        } else {
                            if (center.available_capacity_dose2 > 0) {

                                $('#availablity div').css("background", green);
                                $('#availablity h5').html(`${center.available_capacity_dose2} Slots`);
                                document.title = ' (' + center.available_capacity_dose2 + ') ' + center.name.substr(0, 20);

                                if (i) {
                                    j = true;
                                    $("#audio")[0].play();
                                    setTimeout(() => {
                                        $("#audio_avail")[0].play();
                                    }, 1300);
                                    i = false;
                                }
                            } else {
                                $('#availablity div').css("background", red);
                                $('#availablity h5').html("FULLY BOOKED!");
                                document.title = center.name;

                                if (j) {
                                    i = true;
                                    let audio_text_booked =
                                        document.getElementById("audio_text_booked");
                                    audio_text_booked.volume = 0.6;
                                    audio_text_booked.play();
                                    setTimeout(() => {
                                        $("#audio_booked")[0].play();
                                    }, 1300);
                                    j = false;
                                }
                            }
                        }

                    } else {
                        err = err + 1;
                    }
                });
            } else {
                $('#availablity div').css("background", info);
                $('#availablity h5').html("NOT OPEN!");
            }
            if (err == data.sessions.length) {
                $('#availablity div').css("background", info);
                $('#availablity h5').html("NOT OPEN!");
            }
        } catch (e) {

            if (navigator.onLine) {
                controller = new AbortController();
                signal = controller.signal;
                alert_err_findByPin = true;
            } else {
                controller.abort();
                if (alert_err_findByPin) {
                    alert("Looks like you are out of internet");
                    alert_err_findByPin = false
                }
            }

        }
    }

}



function onlyNumberKey(evt) {

    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
        return false;
    return true;
}

