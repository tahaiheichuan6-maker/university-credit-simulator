// シャッフル
function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}


// 全コマを取得
function getAllSlots() {

    const days = [
        "月",
        "火",
        "水",
        "木",
        "金"
    ];

    const slots = [];

    days.forEach(function (day) {

        for (let period = 1; period <= 5; period++) {

            slots.push({
                day: day,
                period: period
            });
        }
    });

    return slots;
}


// 現在の学年の必修科目を取得
function getRequiredCourses() {

    return courses
        .map(function (course, index) {

            if (course.requiredYear === year) {
                return index;
            }

            return null;
        })
        .filter(function (index) {

            return index !== null;
        });
}


// 通年科目の配置を作成
function createAnnualSlots() {

    const slots = [];

    const annualCourses =
        courses.filter(function (course) {

            if (!course.annual) {
                return false;
            }

            // 他学年の必修通年科目は配置しない
            if (
                course.requiredYear !== undefined &&
                course.requiredYear !== year
            ) {
                return false;
            }

            return true;
        });


    const shuffledCourses =
        shuffle(annualCourses);

    const availableSlots =
        shuffle(getAllSlots());


    shuffledCourses.forEach(function (course) {

        if (availableSlots.length === 0) {
            return;
        }

        const slot =
            availableSlots.pop();

        slots.push({
            courseIndex:
                courses.indexOf(course),

            day:
                slot.day,

            period:
                slot.period
        });
    });


    return slots;
}


// 時間割生成
function createTimetable() {

    const cells =
        document.querySelectorAll("#timetable td");


    // いったん時間割を空にする
    cells.forEach(function (cell) {

        cell.innerHTML = "";

        cell.classList.remove("selected");
        cell.classList.remove("annual");
        cell.classList.remove("required");

        cell.dataset.courseIndex = "";
        cell.dataset.courseName = "";
    });


    // 年度最初の時間割なら
    // 通年科目の曜日・時限を決める
    if (annualSlots.length === 0) {

        annualSlots =
            createAnnualSlots();
    }


    // ==============================
    // 通年科目を配置
    // ==============================

    if (annualSlots.length > 0) {

        annualSlots.forEach(function (slot) {

            const cell =
                document.querySelector(
                    `#timetable td[data-day="${slot.day}"][data-period="${slot.period}"]`
                );


            if (!cell) {
                return;
            }


            const course =
                courses[slot.courseIndex];


            cell.innerHTML =
                `${course.name}<br>${course.credits}単位<br><small>通年</small>`;

            cell.dataset.courseIndex =
                slot.courseIndex;

            cell.dataset.courseName =
                course.name;

            cell.classList.add("annual");


            // 現在の学年の必修通年科目
            if (
                course.requiredYear === year
            ) {

                cell.classList.add("required");
            }
        });
    }


    // ==============================
    // 使用済みコマを記録
    // ==============================

    const occupiedCells =
        new Set();


    annualSlots.forEach(function (slot) {

        occupiedCells.add(
            `${slot.day}-${slot.period}`
        );
    });


    // 通年科目が使っていないコマ
    const availableCells =
        [...cells].filter(function (cell) {

            const key =
                `${cell.dataset.day}-${cell.dataset.period}`;

            return !occupiedCells.has(key);
        });


    // ==============================
    // 必修科目を配置
    // ==============================

    const requiredCourses =
        getRequiredCourses();


    /*
     * 半期必修は前期にのみ配置する。
     *
     * 現在の courses.js では
     * 1年：英語
     * 2年：専門演習
     *
     * が半期必修なので、後期には出さない。
     */
    const semesterRequiredCourses =
        requiredCourses.filter(
            function (courseIndex) {

                return !courses[courseIndex].annual;
            }
        );


    let requiredToPlace = [];


    if (semester === 1) {

        requiredToPlace =
            semesterRequiredCourses;
    }


    // 必修をランダムなコマに配置
    const shuffledRequired =
        shuffle(requiredToPlace);

    const shuffledRequiredCells =
        shuffle(availableCells);


    shuffledRequired.forEach(
        function (courseIndex, index) {

            if (
                index >= shuffledRequiredCells.length
            ) {
                return;
            }


            const cell =
                shuffledRequiredCells[index];


            cell.innerHTML =
                `${courses[courseIndex].name}<br>${courses[courseIndex].credits}単位<br><small>必修</small>`;

            cell.dataset.courseIndex =
                courseIndex;

            cell.dataset.courseName =
                courses[courseIndex].name;

            cell.classList.add("required");
        }
    );


    // ==============================
    // 一般科目を配置
    // ==============================

    /*
     * 通年科目はすでに配置済み。
     *
     * 現在の学年の必修もすでに配置済み。
     *
     * 他学年の必修は時間割に出さない。
     */
    const selectableCourses =
        courses.filter(function (course) {

            // 通年科目
            if (course.annual) {
                return false;
            }

            // 必修科目
            if (
                course.requiredYear !== undefined
            ) {
                return false;
            }

            return true;
        });


    const shuffledCourses =
        shuffle(selectableCourses);


    // 必修で使用したコマを除外して
    // 一般科目を配置する
    const occupiedAfterRequired =
        new Set();


    annualSlots.forEach(function (slot) {

        occupiedAfterRequired.add(
            `${slot.day}-${slot.period}`
        );
    });


    shuffledRequiredCells.forEach(
        function (cell, index) {

            if (
                index < shuffledRequired.length
            ) {

                occupiedAfterRequired.add(
                    `${cell.dataset.day}-${cell.dataset.period}`
                );
            }
        }
    );


    const normalAvailableCells =
        [...cells].filter(function (cell) {

            const key =
                `${cell.dataset.day}-${cell.dataset.period}`;

            return !occupiedAfterRequired.has(key);
        });


    const shuffledCells =
        shuffle(normalAvailableCells);


    /*
     * 今学期に開講される科目数。
     *
     * 25コマを上限として配置する。
     * これは履修数の上限ではない。
     */
    const numberOfCourses =
        Math.min(
            shuffledCourses.length,
            shuffledCells.length
        );


    for (
        let i = 0;
        i < numberOfCourses;
        i++
    ) {

        const course =
            shuffledCourses[i];

        const cell =
            shuffledCells[i];

        const courseIndex =
            courses.indexOf(course);


        cell.innerHTML =
            `${course.name}<br>${course.credits}単位`;

        cell.dataset.courseIndex =
            courseIndex;

        cell.dataset.courseName =
            course.name;
    }


    // ==============================
    // 自動選択
    // ==============================

    selectedCourses = [];


    // 現在の学年の必修は自動履修
    cells.forEach(function (cell) {

        if (
            cell.dataset.courseIndex === ""
        ) {
            return;
        }


        const courseIndex =
            Number(cell.dataset.courseIndex);

        const course =
            courses[courseIndex];


        // 現在の学年の必修
        if (
            course.requiredYear === year
        ) {

            selectedCourses.push(
                courseIndex
            );

            cell.classList.add("selected");

            return;
        }


        // 後期の通年科目
        // 前期に履修開始したものを自動継続
        if (
            semester === 2 &&
            annualCourses.includes(courseIndex)
        ) {

            selectedCourses.push(
                courseIndex
            );

            cell.classList.add("selected");
        }
    });


    updateTimetableSelection();
    updateTimetableStamina();
    updateTimetableCourseCosts();
}


// 時間割の選択状態を更新
function updateTimetableSelection() {

    const cells =
        document.querySelectorAll(
            "#timetable td"
        );


    cells.forEach(function (cell) {

        if (
            cell.dataset.courseIndex === ""
        ) {

            cell.classList.remove(
                "selected"
            );

            return;
        }


        const courseIndex =
            Number(
                cell.dataset.courseIndex
            );


        if (
            selectedCourses.includes(
                courseIndex
            )
        ) {

            cell.classList.add(
                "selected"
            );

        } else {

            cell.classList.remove(
                "selected"
            );
        }
    });
}


// 時間割クリック
function setupTimetableClick() {

    const cells =
        document.querySelectorAll(
            "#timetable td"
        );


    cells.forEach(function (cell) {

        cell.addEventListener(
            "click",
            function () {

                if (gameEnded) {
                    return;
                }


                if (
                    cell.dataset.courseIndex === ""
                ) {
                    return;
                }


                const courseIndex =
                    Number(
                        cell.dataset.courseIndex
                    );


                const course =
                    courses[courseIndex];


                // 後期の通年科目は解除不可
                if (
                    semester === 2 &&
                    annualCourses.includes(
                        courseIndex
                    )
                ) {
                    return;
                }


                // 現在の学年の必修は解除不可
                if (
                    course.requiredYear === year
                ) {
                    return;
                }


                const alreadySelected =
                    selectedCourses.includes(
                        courseIndex
                    );


                if (alreadySelected) {

                    selectedCourses =
                        selectedCourses.filter(
                            function (index) {

                                return (
                                    index !==
                                    courseIndex
                                );
                            }
                        );

                } else {

                    selectedCourses.push(
                        courseIndex
                    );
                }


                updateTimetableSelection();
                updateTimetableStamina();
                updateTimetableCourseCosts();
            }
        );
    });
}


// 連続コマ数を調べる
function getConsecutivePeriods(day, period) {

    const selectedPeriods = [];


    for (
        let p = 1;
        p <= 5;
        p++
    ) {

        const cell =
            document.querySelector(
                `#timetable td[data-day="${day}"][data-period="${p}"]`
            );


        if (
            !cell ||
            cell.dataset.courseIndex === ""
        ) {
            continue;
        }


        const courseIndex =
            Number(
                cell.dataset.courseIndex
            );


        if (
            selectedCourses.includes(
                courseIndex
            )
        ) {

            selectedPeriods.push(p);
        }
    }


    if (
        selectedPeriods.length === 0
    ) {
        return 0;
    }


    // この授業を含む連続区間を探す
    let start = period;
    let end = period;


    while (
        selectedPeriods.includes(
            start - 1
        )
    ) {

        start--;
    }


    while (
        selectedPeriods.includes(
            end + 1
        )
    ) {

        end++;
    }


    return end - start + 1;
}


// 授業1コマあたりのスタミナ消費
function calculateCourseStaminaCost(cell) {

    const courseIndex =
        Number(
            cell.dataset.courseIndex
        );


    const course =
        courses[courseIndex];


    // 基本スタミナ
    let cost =
        course.staminaCost;


    const day =
        cell.dataset.day;


    const period =
        Number(
            cell.dataset.period
        );


    // 5コマ連続
    const consecutive =
        getConsecutivePeriods(
            day,
            period
        );


    if (
        consecutive >= 5
    ) {

        cost *= 1.5;
    }


    // 1限・5限
    if (
        period === 1 ||
        period === 5
    ) {

        cost *= 1.5;
    }


    // 留年中は2倍
    if (
        yearAttempt >= 2
    ) {

        cost *= 2;
    }


    return cost;
}


// 学期全体のスタミナ消費
function calculateStaminaCost() {

    const cells = [
        ...document.querySelectorAll(
            "#timetable td"
        )
    ];


    let totalCost = 0;


    cells.forEach(function (cell) {

        if (
            cell.dataset.courseIndex === ""
        ) {
            return;
        }


        const courseIndex =
            Number(
                cell.dataset.courseIndex
            );


        if (
            !selectedCourses.includes(
                courseIndex
            )
        ) {
            return;
        }


        totalCost +=
            calculateCourseStaminaCost(
                cell
            );
    });


    // ==============================
    // 空きコマ・1コマの日の追加消費
    // ==============================

    const days = [
        "月",
        "火",
        "水",
        "木",
        "金"
    ];


    days.forEach(function (day) {

        const selectedPeriods =
            [];


        for (
            let period = 1;
            period <= 5;
            period++
        ) {

            const cell =
                document.querySelector(
                    `#timetable td[data-day="${day}"][data-period="${period}"]`
                );


            if (
                !cell ||
                cell.dataset.courseIndex === ""
            ) {
                continue;
            }


            const courseIndex =
                Number(
                    cell.dataset.courseIndex
                );


            if (
                selectedCourses.includes(
                    courseIndex
                )
            ) {

                selectedPeriods.push(
                    period
                );
            }
        }


        // その日に1コマだけなら+30
        if (
            selectedPeriods.length === 1
        ) {

            totalCost += 30;
        }


        // コマとコマの間の空き
        for (
            let i = 1;
            i < selectedPeriods.length;
            i++
        ) {

            const gap =
                selectedPeriods[i] -
                selectedPeriods[i - 1] -
                1;


            if (gap > 0) {

                totalCost +=
                    gap * 30;
            }
        }
    });


    // 小数点以下を切り上げ
    return Math.ceil(totalCost);
}


// 時間割下のスタミナ表示
function updateTimetableStamina() {

    let credits = 0;
    let classCost = 0;
    let gapCost = 0;

    const days = [
        "月",
        "火",
        "水",
        "木",
        "金"
    ];

    const cells = [
        ...document.querySelectorAll(
            "#timetable td"
        )
    ];


    // 履修単位と授業そのものの消費
    cells.forEach(function (cell) {

        if (
            cell.dataset.courseIndex === ""
        ) {
            return;
        }


        const courseIndex =
            Number(
                cell.dataset.courseIndex
            );


        if (
            !selectedCourses.includes(
                courseIndex
            )
        ) {
            return;
        }


        const course =
            courses[courseIndex];


        credits +=
            course.credits;


        classCost +=
            calculateCourseStaminaCost(
                cell
            );
    });


    // 空きコマ・1コマの追加消費
    days.forEach(function (day) {

        const selectedPeriods = [];


        for (
            let period = 1;
            period <= 5;
            period++
        ) {

            const cell =
                document.querySelector(
                    `#timetable td[data-day="${day}"][data-period="${period}"]`
                );


            if (
                !cell ||
                cell.dataset.courseIndex === ""
            ) {
                continue;
            }


            const courseIndex =
                Number(
                    cell.dataset.courseIndex
                );


            if (
                selectedCourses.includes(
                    courseIndex
                )
            ) {

                selectedPeriods.push(
                    period
                );
            }
        }


        // その日に1コマだけなら+30
        if (
            selectedPeriods.length === 1
        ) {

            gapCost += 30;
        }


        // コマとコマの間の空き
        for (
            let i = 1;
            i < selectedPeriods.length;
            i++
        ) {

            const gap =
                selectedPeriods[i] -
                selectedPeriods[i - 1] -
                1;


            if (gap > 0) {

                gapCost +=
                    gap * 30;
            }
        }
    });


    const totalCost =
        Math.ceil(classCost + gapCost);


    const display =
        document.getElementById(
            "timetableStamina"
        );


    if (!display) {
        return;
    }


    display.innerHTML =
        `今学期の履修：${credits}単位<br>
        今学期のスタミナ消費：${Math.ceil(classCost)}<br>
        空きコマの追加消費：+${gapCost}<br>
        合計消費スタミナ：${totalCost} / 現在のスタミナ：${Math.round(stamina)}`;
        }

function updateTimetableCourseCosts() {

    const cells =
        document.querySelectorAll("#timetable td");

    cells.forEach(function (cell) {

        if (cell.dataset.courseIndex === "") {
            return;
        }

        const courseIndex =
            Number(cell.dataset.courseIndex);

        const course =
            courses[courseIndex];

        const basicCost =
            course.staminaCost;

        const actualCost =
            calculateCourseStaminaCost(cell);

        let costText =
            `消費：${basicCost}`;

        if (actualCost > basicCost) {
            costText =
                `消費：${basicCost} → <span class="increased-cost">${Math.ceil(actualCost)}</span>`;
        }

        let typeText = "";

        if (course.annual) {
            typeText = "<br><small>通年</small>";
        } else if (course.requiredYear === year) {
            typeText = "<br><small>必修</small>";
        }

        cell.innerHTML =
            `${course.name}<br>${course.credits}単位<br>${costText}${typeText}`;
    });
}
