let requiredCredits = 128;
let currentCredits = 0;

let stamina = 950;
const maxStamina = 950;

let year = 1;
let semester = 1;

// 現在の学年を何回目にやっているか
// 1 = 初回
// 2以上 = 留年中
let yearAttempt = 1;

// ゲーム終了フラグ
let gameEnded = false;

// 現在の履修状況
let selectedCourses = [];

// 通年科目として前期に履修開始した授業
let annualCourses = [];

// 通年科目が配置されているコマ
let annualSlots = [];

const semesterElement =
    document.getElementById("semester");

const currentCreditsElement =
    document.getElementById("currentCredits");

const remainingCreditsElement =
    document.getElementById("remainingCredits");

const staminaElement =
    document.getElementById("stamina");

const semesterButton =
    document.getElementById("semesterButton");

const resetButton =
    document.getElementById("resetButton");

const messageElement =
    document.getElementById("message");

const dropoutButton =
    document.getElementById("dropoutButton");


// ステータス表示
function updateStatus() {

    const semesterName =
        semester === 1
            ? "前期"
            : "後期";

    semesterElement.textContent =
        `${year}年生・${semesterName}`;

    currentCreditsElement.textContent =
        currentCredits;

    remainingCreditsElement.textContent =
        Math.max(
            requiredCredits - currentCredits,
            0
        );

    staminaElement.textContent =
        `${Math.round(stamina)} / ${maxStamina}`;
}


// 中退
dropoutButton.addEventListener(
    "click",
    function () {

        if (gameEnded) {
            return;
        }

        const confirmed =
            window.confirm(
                "本当に大学を中退しますか？"
            );

        if (!confirmed) {
            return;
        }

        gameEnded = true;

        semesterButton.disabled = true;
        dropoutButton.disabled = true;

        messageElement.textContent =
            "大学を中退しました、次の人生を考えましょう。";
    }
);


// リセット
resetButton.addEventListener(
    "click",
    function () {

        location.reload();
    }
);


// 学期を終える
semesterButton.addEventListener(
    "click",
    function () {

        if (gameEnded) {
            return;
        }


        if (selectedCourses.length === 0) {

            messageElement.textContent =
                "少なくとも1科目は履修してください。";

            return;
        }


        // スタミナ消費を計算
        const staminaCost =
            calculateStaminaCost();


        // スタミナ不足
        if (staminaCost > stamina) {

            messageElement.textContent =
                `スタミナが足りません。この履修ではスタミナを${staminaCost}消費するため、学期を乗り越えられません。`;

            return;
        }


        // 単位取得
        selectedCourses.forEach(
            function (index) {

                const course =
                    courses[index];

                // 半期科目はその学期で取得
                // 通年科目は後期終了時に取得
                if (
                    !course.annual ||
                    semester === 2
                ) {

                    currentCredits +=
                        course.credits;
                }
            }
        );


        // スタミナ消費
        stamina -=
            staminaCost;


        // 学期終了時に50回復
        stamina +=
            50;


        if (stamina > maxStamina) {
            stamina = maxStamina;
        }


        // 4年後期終了時の卒業判定
        if (
            year === 4 &&
            semester === 2 &&
            currentCredits >= requiredCredits
        ) {

            updateStatus();

            messageElement.textContent =
                "卒業おめでとう！大学を卒業しました！";

            gameEnded = true;

            semesterButton.disabled = true;
            dropoutButton.disabled = true;

            return;
        }


        // 後期終了時
        if (semester === 2) {


            // 1年生終了
            if (year === 1) {

                year = 2;
                yearAttempt = 1;

                messageElement.textContent =
                    `1年生終了！累計${currentCredits}単位。2年生へ進級します。`;
            }


            // 2年生終了
            else if (year === 2) {

                if (currentCredits >= 50) {

                    year = 3;
                    yearAttempt = 1;

                    messageElement.textContent =
                        `2年生終了！累計${currentCredits}単位で進級しました。3年生です。`;

                } else {

                    yearAttempt++;

                    messageElement.textContent =
                        `2年生終了。累計${currentCredits}単位で50単位に届かなかったため留年です。次の2年生ではスタミナ消費が2倍になります。`;
                }
            }


            // 3年生終了
            else if (year === 3) {

                year = 4;
                yearAttempt = 1;

                messageElement.textContent =
                    `3年生終了！累計${currentCredits}単位。4年生へ進級します。`;
            }


            // 4年生終了
            else if (year === 4) {

                if (currentCredits >= requiredCredits) {

                    updateStatus();

                    messageElement.textContent =
                        "卒業おめでとう！大学を卒業しました！";

                    gameEnded = true;

                    semesterButton.disabled = true;
                    dropoutButton.disabled = true;

                    return;

                } else {

                    yearAttempt++;

                    messageElement.textContent =
                        `4年生終了。累計${currentCredits}単位で卒業に必要な128単位に届きませんでした。4年生をやり直します。スタミナ消費は2倍です。`;
                }
            }


            // 次の年度は前期
            semester = 1;


            // 年度が変わるので
            // 通年科目の情報をリセット
            annualCourses = [];
            annualSlots = [];

        } else {

            // 前期 → 後期
            semester = 2;


            // 前期に選択した通年科目を記録
            annualCourses =
                selectedCourses.filter(
                    function (index) {

                        return courses[index].annual;
                    }
                );


            // 前期の時間割から
            // 通年科目の曜日・時限を保存
            annualSlots = [];


            annualCourses.forEach(
                function (courseIndex) {

                    const cells =
                        document.querySelectorAll(
                            "#timetable td"
                        );


                    cells.forEach(
                        function (cell) {

                            if (
                                cell.dataset.courseIndex ===
                                String(courseIndex)
                            ) {

                                annualSlots.push({
                                    courseIndex:
                                        courseIndex,

                                    day:
                                        cell.dataset.day,

                                    period:
                                        cell.dataset.period
                                });
                            }
                        }
                    );
                }
            );
        }


        // 新しい学期
        selectedCourses = [];


        createTimetable();

        updateTimetableSelection();

        updateStatus();
    }
);


// 初期化
createTimetable();

setupTimetableClick();

updateStatus();
