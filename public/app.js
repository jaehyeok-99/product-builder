document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        mode: 'pace', // 'pace', 'time', 'distance'
        distance: 5, // km
        time: { h: 0, m: 0, s: 0 },
        pace: { m: 0, s: 0 }
    };

    // --- DOM Elements ---
    const tabs = document.querySelectorAll('.tab-btn');
    const groupDistance = document.getElementById('group-distance');
    const groupTime = document.getElementById('group-time');
    const groupPace = document.getElementById('group-pace');

    const distanceSelect = document.getElementById('distance-select');
    const customDistanceWrapper = document.getElementById('custom-distance-wrapper');
    const distanceCustomInput = document.getElementById('distance-custom');

    const inputs = {
        h: document.getElementById('time-hour'),
        m: document.getElementById('time-min'),
        s: document.getElementById('time-sec'),
        paceM: document.getElementById('pace-min'),
        paceS: document.getElementById('pace-sec')
    };

    const calcBtn = document.getElementById('calc-btn');
    const resultDisplay = document.getElementById('result-display');
    const resultLabel = document.getElementById('result-label');
    const resultValue = document.getElementById('result-value');
    const resultUnit = document.getElementById('result-unit');
    const splitsCard = document.getElementById('splits-card');
    const splitsTableBody = document.querySelector('#splits-table tbody');
    const splitToggles = document.querySelectorAll('.split-toggle');

    // --- Logic : Initialization ---
    function init() {
        setupEventListeners();
        updateUIState();
    }

    function setupEventListeners() {
        // Tab Switching
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                state.mode = e.target.dataset.mode;
                updateUIState();
                resetResults();
            });
        });

        // Distance Select
        distanceSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customDistanceWrapper.classList.remove('hidden');
                state.distance = parseFloat(distanceCustomInput.value) || 0;
            } else {
                customDistanceWrapper.classList.add('hidden');
                state.distance = parseFloat(e.target.value);
            }
        });

        // Custom Distance Input
        distanceCustomInput.addEventListener('input', (e) => {
            state.distance = parseFloat(e.target.value) || 0;
        });

        // Button Click
        calcBtn.addEventListener('click', calculate);

        // Split Toggle
        splitToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                splitToggles.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                // Re-render splits if results exist
                if (splitsCard.classList.contains('visible')) {
                    generateSplits(parseInt(e.target.dataset.gap));
                }
            });
        });
    }

    // --- Logic : UI Updates ---
    function updateUIState() {
        // Show/Hide input groups based on mode
        switch (state.mode) {
            case 'pace': // Calculate Pace based on Time & Distance
                groupDistance.classList.remove('hidden');
                groupTime.classList.remove('hidden');
                groupPace.classList.add('hidden');

                resultLabel.innerText = "평균 페이스 (Average Pace)";
                resultUnit.innerText = "/km";
                break;
            case 'time': // Calculate Time based on Pace & Distance
                groupDistance.classList.remove('hidden');
                groupTime.classList.add('hidden');
                groupPace.classList.remove('hidden');

                resultLabel.innerText = "예상 소요 시간 (Estimated Time)";
                resultUnit.innerText = "";
                break;
            case 'distance': // Calculate Distance based on Pace & Time (Less common but useful)
                groupDistance.classList.add('hidden');
                groupTime.classList.remove('hidden');
                groupPace.classList.remove('hidden');

                resultLabel.innerText = "가능 거리 (Estimated Distance)";
                resultUnit.innerText = "km";
                break;
        }
    }

    function resetResults() {
        resultValue.innerText = "--:--";
        splitsCard.classList.remove('visible');
    }

    // --- Logic : Calculation ---
    function calculate() {
        const mode = state.mode;
        let dist = state.distance;

        // Handle custom distance check
        if (distanceSelect.value === 'custom') {
            dist = parseFloat(distanceCustomInput.value);
            if (!dist || dist <= 0) {
                alert("거리를 올바르게 입력해주세요.");
                return;
            }
        }

        // Get Time values
        const h = parseInt(inputs.h.value) || 0;
        const m = parseInt(inputs.m.value) || 0;
        const s = parseInt(inputs.s.value) || 0;
        const totalTimeSeconds = (h * 3600) + (m * 60) + s;

        // Get Pace values
        const pM = parseInt(inputs.paceM.value) || 0;
        const pS = parseInt(inputs.paceS.value) || 0;
        const paceSecondsPerKm = (pM * 60) + pS;

        if (mode === 'pace') {
            if (totalTimeSeconds === 0) {
                alert("시간을 입력해주세요.");
                return;
            }
            // Pace = Time / Distance
            const resultPaceSec = totalTimeSeconds / dist;
            displayPace(resultPaceSec);
            // Prepare data for splits (we know Pace and Distance)
            state.calculatedPace = resultPaceSec;
            state.calculatedDist = dist;
            state.calculatedTime = totalTimeSeconds;

        } else if (mode === 'time') {
            if (paceSecondsPerKm === 0) {
                alert("페이스를 입력해주세요.");
                return;
            }
            // Time = Pace * Distance
            const resultTimeSec = paceSecondsPerKm * dist;
            displayTime(resultTimeSec);

            state.calculatedPace = paceSecondsPerKm;
            state.calculatedDist = dist;
            state.calculatedTime = resultTimeSec;

        } else if (mode === 'distance') {
            if (paceSecondsPerKm === 0 || totalTimeSeconds === 0) {
                alert("시간과 페이스를 입력해주세요.");
                return;
            }
            // Distance = Time / Pace
            const resultDist = totalTimeSeconds / paceSecondsPerKm;
            resultValue.innerText = resultDist.toFixed(2);
            resultUnit.innerText = "km";

            state.calculatedPace = paceSecondsPerKm;
            state.calculatedDist = resultDist;
            state.calculatedTime = totalTimeSeconds;
        }

        // Generate Splits if applicable
        if (mode !== 'distance' || (mode === 'distance' && state.calculatedDist > 0)) {
            splitsCard.classList.add('visible');
            const activeGap = document.querySelector('.split-toggle.active').dataset.gap;
            generateSplits(parseInt(activeGap));
        }
    }

    // --- Logic : Helpers ---
    function formatTime(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function displayPace(secondsPerKm) {
        const m = Math.floor(secondsPerKm / 60);
        const s = Math.floor(secondsPerKm % 60);
        resultValue.innerText = `${m}'${s.toString().padStart(2, '0')}"`;
        resultUnit.innerText = "/km";
    }

    function displayTime(totalSeconds) {
        resultValue.innerText = formatTime(totalSeconds);
        resultUnit.innerText = "Total Time";
    }

    function generateSplits(gapKm) {
        splitsTableBody.innerHTML = '';
        const totalDist = state.calculatedDist;
        const paceSec = state.calculatedPace;

        let currentDist = 0;

        // Loop until total distance
        while (currentDist < totalDist) {
            let nextDist = currentDist + gapKm;
            if (nextDist > totalDist) nextDist = totalDist;

            // Time at this split point
            const timeAtSplit = nextDist * paceSec;

            // For the row
            const tr = document.createElement('tr');

            // Col 1: Distance
            const tdDist = document.createElement('td');
            tdDist.innerText = nextDist === totalDist ? `${nextDist.toFixed(2)} km (Finish)` : `${nextDist} km`;

            // Col 2: Cumulative Time
            const tdTime = document.createElement('td');
            tdTime.innerText = formatTime(timeAtSplit);

            // Col 3: Split Pace (Assuming constant pace for now, but usually it's avg)
            // Real apps might allow segment pace variation, but for a basic calculator constant is fine.
            const tdPace = document.createElement('td');
            const m = Math.floor(paceSec / 60);
            const s = Math.floor(paceSec % 60);
            tdPace.innerText = `${m}'${s.toString().padStart(2, '0')}"`;

            tr.appendChild(tdDist);
            tr.appendChild(tdTime);
            tr.appendChild(tdPace);

            splitsTableBody.appendChild(tr);

            currentDist = nextDist;
            if (nextDist === totalDist) break;
        }
    }

    // Run Init
    init();
});
