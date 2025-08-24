
// 경기도 주요 시의 격자 좌표 (기상청 격자 좌표계)
const cityCoordinates = {
    '수원시': { nx: 60, ny: 121 },
    '고양시': { nx: 57, ny: 128 },
    '용인시': { nx: 64, ny: 119 },
    '성남시': { nx: 63, ny: 124 },
    '부천시': { nx: 56, ny: 125 },
    '화성시': { nx: 57, ny: 119 },
    '안산시': { nx: 58, ny: 121 },
    '안양시': { nx: 59, ny: 123 },
    '평택시': { nx: 62, ny: 114 },
    '시흥시': { nx: 57, ny: 123 }
};

// API 설정
const API_KEY = 'OaRLlfpKOXJH%2BFeghkAojoaSAQbb1bkFF9COvGfjixpiLkEYTHFLqIcBYqFb0HCrcX8H3A47X9QNiRpgcCXAOA%3D%3D';
const BASE_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';

// DOM 요소들
const citySelect = document.getElementById('citySelect');
const getWeatherBtn = document.getElementById('getWeatherBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherInfo = document.getElementById('weatherInfo');
const errorMessage = document.getElementById('errorMessage');

// 날씨 상태 코드를 한국어로 변환
const weatherConditions = {
    '1': { text: '맑음', icon: 'fas fa-sun' },
    '3': { text: '구름많음', icon: 'fas fa-cloud-sun' },
    '4': { text: '흐림', icon: 'fas fa-cloud' },
    '5': { text: '비', icon: 'fas fa-cloud-rain' },
    '6': { text: '눈비', icon: 'fas fa-cloud-rain' },
    '7': { text: '눈', icon: 'fas fa-snowflake' }
};

// 이벤트 리스너
getWeatherBtn.addEventListener('click', getWeather);
citySelect.addEventListener('change', function() {
    if (this.value) {
        getWeatherBtn.disabled = false;
    }
});

// 현재 날짜와 시간을 YYYYMMDD, HHMM 형식으로 반환
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    let hour = now.getHours();
    
    // 기상청 API는 매시 30분에 업데이트되므로, 30분 이전이면 이전 시간 사용
    if (now.getMinutes() < 30) {
        hour = hour - 1;
        if (hour < 0) {
            hour = 23;
            // 전날로 넘어가는 경우는 간단히 처리
        }
    }
    
    const baseDate = `${year}${month}${day}`;
    const baseTime = String(hour).padStart(2, '0') + '00';
    
    return { baseDate, baseTime };
}

// 날씨 정보 가져오기
async function getWeather() {
    const selectedCity = citySelect.value;
    if (!selectedCity) {
        alert('시/군을 선택해주세요.');
        return;
    }

    const coordinates = cityCoordinates[selectedCity];
    const { baseDate, baseTime } = getCurrentDateTime();

    showLoading();

    try {
        const url = `${BASE_URL}?serviceKey=${API_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${coordinates.nx}&ny=${coordinates.ny}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.response.header.resultCode === '00') {
            displayWeather(data.response.body.items.item, selectedCity);
        } else {
            throw new Error('API 응답 오류');
        }
    } catch (error) {
        console.error('날씨 정보 가져오기 실패:', error);
        showError();
    }
}

// 날씨 정보 화면에 표시
function displayWeather(items, cityName) {
    hideAll();
    
    // 데이터 파싱
    const weatherData = {};
    items.forEach(item => {
        weatherData[item.category] = item.obsrValue;
    });

    // 현재 시간 표시
    const now = new Date();
    const timeString = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} 기준`;

    // DOM 업데이트
    document.getElementById('cityName').textContent = cityName;
    document.getElementById('updateTime').textContent = timeString;
    document.getElementById('temperature').textContent = weatherData.T1H || '--';
    document.getElementById('humidity').textContent = (weatherData.REH || '--') + '%';
    document.getElementById('windSpeed').textContent = (weatherData.WSD || '--') + ' m/s';
    
    // 날씨 상태 설정
    const skyCondition = weatherData.PTY !== '0' ? weatherData.PTY : weatherData.SKY;
    const condition = weatherConditions[skyCondition] || { text: '정보없음', icon: 'fas fa-question' };
    
    document.getElementById('weatherCondition').textContent = condition.text;
    document.getElementById('weatherIcon').className = condition.icon;
    
    // 체감온도는 기온과 동일하게 표시 (실제로는 복잡한 계산 필요)
    document.getElementById('feelsLike').textContent = (weatherData.T1H || '--') + '°C';
    
    // 강수확률은 단기예보에서만 제공되므로 기본값 설정
    document.getElementById('rainProb').textContent = '정보없음';

    weatherInfo.classList.remove('hidden');
}

// 로딩 표시
function showLoading() {
    hideAll();
    loadingSpinner.classList.remove('hidden');
}

// 오류 메시지 표시
function showError() {
    hideAll();
    errorMessage.classList.remove('hidden');
}

// 모든 상태 숨기기
function hideAll() {
    loadingSpinner.classList.add('hidden');
    weatherInfo.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    getWeatherBtn.disabled = true;
});

// CORS 문제 해결을 위한 프록시 함수 (실제 운영 시에는 백엔드에서 처리 필요)
async function fetchWithProxy(url) {
    try {
        // 직접 호출 시도
        const response = await fetch(url);
        return response;
    } catch (error) {
        // CORS 오류가 발생하면 프록시 서버 사용 (예: cors-anywhere)
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/' + url;
        const response = await fetch(proxyUrl);
        return response;
    }
}
