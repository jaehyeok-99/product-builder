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
    const groupType = document.getElementById('group-type'); // New

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
    const resetBtn = document.getElementById('reset-btn'); // New
    const resultDisplay = document.getElementById('result-display');
    const resultLabel = document.getElementById('result-label');
    const resultValue = document.getElementById('result-value');
    const resultUnit = document.getElementById('result-unit');
    const splitsCard = document.getElementById('splits-card');
    const splitsTableBody = document.querySelector('#splits-table tbody');
    const splitToggles = document.querySelectorAll('.split-toggle');

    const predictionCard = document.getElementById('prediction-card');
    const predictionGrid = document.getElementById('prediction-grid');
    const labelDistance = document.getElementById('label-distance');
    const labelTime = document.getElementById('label-time');

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
            // 숫자와 소수점만 허용
            e.target.value = e.target.value.replace(/[^0-9.]/g, '');
            state.distance = parseFloat(e.target.value) || 0;
        });

        // 나머지 숫자 입력 필드 (정수만 허용)
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        });

        // Button Clicks
        calcBtn.addEventListener('click', calculate);
        resetBtn.addEventListener('click', resetAll); // New

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
                groupType.classList.add('hidden'); // Type hide
                break;
            case 'time': // Calculate Time based on Pace & Distance
                groupDistance.classList.remove('hidden');
                groupTime.classList.add('hidden');
                groupPace.classList.remove('hidden');

                resultLabel.innerText = "예상 소요 시간 (Estimated Time)";
                resultUnit.innerText = "";
                labelDistance.innerText = "거리 (Distance)";
                labelTime.innerText = "시간 (Time)";
                groupType.classList.add('hidden');
                break;
            case 'predict': // Race Predictor
                groupDistance.classList.remove('hidden');
                groupTime.classList.remove('hidden');
                groupPace.classList.add('hidden');
                groupType.classList.remove('hidden');

                labelDistance.innerText = "기준 거리 (Base Distance)";
                labelTime.innerText = "최근 기록 (Recent Record)";

                // Hide main result display in predict mode as we use a separate card
                resultDisplay.style.display = 'none';
                predictionCard.style.display = 'none'; // Hidden until calc
                return; // Special case return
        }
        // Default visibility for non-predict modes
        resultDisplay.style.display = 'block';
        predictionCard.style.display = 'none';
    }

    function resetResults() {
        resultValue.innerText = "--:--";
        splitsCard.classList.remove('visible');
        predictionCard.style.display = 'none';
        if (state.mode !== 'predict') {
            resultDisplay.style.display = 'block';
        }
    }

    function resetAll() {
        // Reset Inputs to defaults
        distanceSelect.value = "5";
        state.distance = 5;
        customDistanceWrapper.classList.add('hidden');
        distanceCustomInput.value = "";

        inputs.h.value = "";
        inputs.m.value = "";
        inputs.s.value = "";
        inputs.paceM.value = "";
        inputs.paceS.value = "";

        // Reset State
        resetResults();
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

        } else if (mode === 'predict') {
            if (totalTimeSeconds === 0) {
                alert("기준 기록(시간)을 입력해주세요.");
                return;
            }
            const decay = parseFloat(document.getElementById('runner-type').value) || 1.06;
            generatePredictions(dist, totalTimeSeconds, decay);
            return; // Predict mode doesn't use splits or standard result display
        }

        // Generate Splits (Only for Pace/Time modes)
        splitsCard.classList.add('visible');
        const activeGap = document.querySelector('.split-toggle.active').dataset.gap;
        generateSplits(parseInt(activeGap));
    }

    // --- Logic : Prediction ---
    function generatePredictions(baseDist, baseTimeSec, decay) {
        const targets = [
            { label: '5km', dist: 5 },
            { label: '10km', dist: 10 },
            { label: '하프 마라톤 (Half)', dist: 21.0975 },
            { label: '풀 마라톤 (Full)', dist: 42.195 }
        ];

        predictionGrid.innerHTML = '';

        targets.forEach(target => {
            // Riegel Formula: T2 = T1 * (D2 / D1)^Decay
            const predictedTimeSec = baseTimeSec * Math.pow((target.dist / baseDist), decay);
            const paceSec = predictedTimeSec / target.dist;

            // Format Time
            const timeStr = formatTime(predictedTimeSec);

            // Format Pace
            const pM = Math.floor(paceSec / 60);
            const pS = Math.floor(paceSec % 60);
            const paceStr = `${pM}'${pS.toString().padStart(2, '0')}"`;

            const card = document.createElement('div');
            card.className = 'predict-item';

            // Highlight if it matches base distance (approx)
            if (Math.abs(target.dist - baseDist) < 0.1) {
                card.classList.add('highlight');
            }

            card.innerHTML = `
                <div class="predict-title">${target.label}</div>
                <div class="predict-time">${timeStr}</div>
                <div class="predict-pace">@ ${paceStr}/km</div>
            `;

            predictionGrid.appendChild(card);
        });

        predictionCard.style.display = 'block';

        // Scroll to results on mobile
        predictionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    // --- Logic : Feedback Modal ---
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackOpenBtn = document.getElementById('feedback-open-btn');
    const feedbackCloseBtn = document.getElementById('feedback-close-btn');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackStatus = document.getElementById('feedback-status');

    if (feedbackOpenBtn && feedbackModal) {
        // Open
        feedbackOpenBtn.addEventListener('click', () => {
            feedbackModal.classList.remove('hidden');
            feedbackStatus.innerText = "";
            feedbackStatus.className = "status-msg";
        });

        // Close
        feedbackCloseBtn.addEventListener('click', () => {
            feedbackModal.classList.add('hidden');
        });

        // Close on outside click
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) {
                feedbackModal.classList.add('hidden');
            }
        });

        // Form Submit (AJAX)
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const data = new FormData(form);

            feedbackStatus.innerText = "전송 중...";
            feedbackStatus.className = "status-msg";

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    feedbackStatus.innerText = "소중한 의견 감사합니다! 성공적으로 전송되었습니다.";
                    feedbackStatus.className = "status-msg success";
                    form.reset();
                    // Close after 2 seconds
                    setTimeout(() => {
                        feedbackModal.classList.add('hidden');
                        feedbackStatus.innerText = "";
                    }, 2000);
                } else {
                    const errorData = await response.json();
                    if (Object.hasOwn(errorData, 'errors')) {
                        feedbackStatus.innerText = errorData["errors"].map(error => error["message"]).join(", ");
                    } else {
                        feedbackStatus.innerText = "전송에 실패했습니다. 잠시 후 다시 시도해주세요.";
                    }
                    feedbackStatus.className = "status-msg error";
                }
            } catch (error) {
                feedbackStatus.innerText = "네트워크 오류가 발생했습니다.";
                feedbackStatus.className = "status-msg error";
            }
        });
    }

    // Run Init
    init();
});
