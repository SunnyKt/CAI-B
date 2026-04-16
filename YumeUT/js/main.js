/* ============================================================
   main.js — 玉山 Yume 互動邏輯
   ============================================================ */

$(function () {

    /* ----- 子選單開關 Sub Menu Toggle ----- */
    var $menuToggleBtn = $('#menuToggleBtn');
    var $subMenu       = $('#subMenu');
    var $hotPanel      = $('#hotPanel');
    var $btmGroup      = $menuToggleBtn.closest('.btm-group');

    $menuToggleBtn.on('click', function () {
        var isOpen = $subMenu.hasClass('is-open');

        if (isOpen) {
            // 收合 Close
            $subMenu.removeClass('is-open').attr('aria-hidden', 'true');
            $hotPanel.removeClass('is-open').attr('aria-hidden', 'true');
            $btmGroup.removeClass('is-open');
            $menuToggleBtn.attr('aria-expanded', 'false');
        } else {
            // 展開 Open
            $subMenu.addClass('is-open').attr('aria-hidden', 'false');
            $hotPanel.addClass('is-open').attr('aria-hidden', 'false');
            $btmGroup.addClass('is-open');
            $menuToggleBtn.attr('aria-expanded', 'true');
            // 確保目前 active 的 sub-menu tab 對應的 hot-menu 也是 active
            var activeTab = $('.sub-menu__item.is-active').data('tab');
            $('.hot-menu').removeClass('is-active');
            $('.hot-menu[data-tab-panel="' + activeTab + '"]').addClass('is-active');
        }
    });

    /* ----- 子選單分頁切換 Sub Menu Tab Switch ----- */
    $('.sub-menu__item').on('click', function () {
        var tab     = parseInt($(this).data('tab'), 10);
        var $next    = $('.hot-menu[data-tab-panel="' + tab + '"]');
        var $current = $('.hot-menu.is-active');
        if ($current.is($next)) return;

        var currentTab = parseInt($('.sub-menu__item.is-active').data('tab'), 10);
        var goRight    = tab > currentTab; // true = 向右切換

        // 更新 tab 按鈕
        $('.sub-menu__item').removeClass('is-active');
        $(this).addClass('is-active');

        // 把新面板放到畫面外（不帶動畫）
        $next.css('transition', 'none')
             .addClass(goRight ? 'slide-from-right' : 'slide-from-left');
        $next[0].offsetHeight; // force reflow

        // 恢復 transition，同步滑出舊 / 滑入新
        $next.css('transition', '');
        $current.addClass(goRight ? 'slide-to-left' : 'slide-to-right')
                .removeClass('is-active');
        $next.removeClass('slide-from-right slide-from-left')
             .addClass('is-active');

        // 清除殘餘 class
        setTimeout(function () {
            $current.removeClass('slide-to-left slide-to-right');
        }, 320);
    });

    /* ----- 點選單外部關閉 Click Outside to Close ----- */
    $(document).on('click', function (e) {
        if (!$subMenu.hasClass('is-open')) return;
        var $target = $(e.target);
        if ($target.closest($subMenu).length ||
            $target.closest($hotPanel).length ||
            $target.closest($btmGroup).length) return;
        $subMenu.removeClass('is-open').attr('aria-hidden', 'true');
        $hotPanel.removeClass('is-open').attr('aria-hidden', 'true');
        $btmGroup.removeClass('is-open');
        $menuToggleBtn.attr('aria-expanded', 'false');
    });

    /* ----- 熱門選單項目點擊 Hot Menu Item Click ----- */
    $(document).on('click', '.hot-menu__item', function () {
        var itemText = $(this).text().trim();
        // 收合選單
        $subMenu.removeClass('is-open').attr('aria-hidden', 'true');
        $hotPanel.removeClass('is-open').attr('aria-hidden', 'true');
        $btmGroup.removeClass('is-open');
        $menuToggleBtn.attr('aria-expanded', 'false');
        // 將文字填入輸入框
        $('.bottom-menu__placeholder').text(itemText);
    });

    /* ----- 資訊選單 Info Menu Toggle ----- */
    var $infoBtn      = $('[aria-label="資訊"]');
    var $topMenu      = $('#topMenu');
    var $topOverlay   = $('#topMenuOverlay');
    var $closeBtn     = $('#topMenuCloseBtn');

    function openTopMenu() {
        $topMenu.addClass('is-open').attr('aria-hidden', 'false');
        $topOverlay.addClass('is-open').attr('aria-hidden', 'false');
    }

    function closeTopMenu() {
        $topMenu.removeClass('is-open').attr('aria-hidden', 'true');
        $topOverlay.removeClass('is-open').attr('aria-hidden', 'true');
    }

    $infoBtn.on('click', openTopMenu);
    $closeBtn.on('click', closeTopMenu);
    $topOverlay.on('click', closeTopMenu); /* 點遮罩也可關閉 */

    /* ----- 關閉按鈕 → 回到 intro ----- */
    $('#closeTointroBtn').on('click', function () {
        window.location.href = 'index.html';
    });

    /* ----- 夜間模式切換 Dark Mode Toggle ----- */
    $('[aria-label="夜間模式"]').on('click', function () {
        window.location.href = 'index-dark.html'; // 夜間模式（index-light → index-dark）
    });

    /* ----- 從開場動畫進入時自動開啟 top-menu ----- */
    if (sessionStorage.getItem('openTopMenu') === '1') {
        sessionStorage.removeItem('openTopMenu');
        // 略延後確保瀏覽器完成首次繪製，讓進場動畫清楚可見
        setTimeout(openTopMenu, 120);
    }

    /* ----- 輸入框點擊（模擬輸入）Input Button Click ----- */
    $('#inputBtn').on('click', function () {
        // 預留：可在此開啟實際 input 元素或對話框
    });

    /* ----- 送出按鈕 Send Button ----- */
    $('.bottom-menu__send-btn').on('click', function () {
        var text = $('.bottom-menu__placeholder').text().trim();
        if (text && text !== '請輸入文字') {
            // 預留：送出邏輯
            $('.bottom-menu__placeholder').text('請輸入文字');
        }
    });

    /* ============================== */
    /* 聊天互動流程 Chat Flow          */
    /* ============================== */

    var $contentFrame      = $('.content-frame');
    var $thinkingIndicator = $('#thinkingIndicator');
    var THINK_DELAY        = 2000; // ms

    /* 捲動至底部 */
    function scrollToBottom() {
        $contentFrame.animate({ scrollTop: $contentFrame[0].scrollHeight }, 300);
    }

    /* 捲動讓 AI 訊息卡片頂部對齊跑馬燈下方 40px */
    function scrollToCard($aiMsg) {
        var elTop      = $aiMsg.offset().top;
        var frameTop   = $contentFrame.offset().top;
        var currScroll = $contentFrame.scrollTop();
        var target     = currScroll + (elTop - frameTop) - 40;
        $contentFrame.animate({ scrollTop: Math.max(0, target) }, 350);
    }

    /* 顯示元素並觸發進場動畫 */
    function showMsg($el) {
        $el.css('display', '').addClass('is-appear');
        $el.one('animationend', function () { $el.removeClass('is-appear'); });
        scrollToBottom();
    }

    /* 顯示思考指示器 */
    function showThinking() {
        showMsg($thinkingIndicator);
    }

    /* 隱藏思考指示器，然後顯示 AI 回覆（捲到卡頂）*/
    function showAiReply($aiMsg) {
        $thinkingIndicator.hide();
        $aiMsg.css('display', '').addClass('is-appear');
        $aiMsg.one('animationend', function () { $aiMsg.removeClass('is-appear'); });
        scrollToCard($aiMsg);
    }

    /* ----- Step 1：快捷按鈕「查詢帳單/明細」----- */
    $('.link-btns').on('click', '.link-btns__item', function () {
        var label = $(this).text().trim();
        if (label !== '查詢帳單/明細') return;

        // 快捷按鈕不再可點擊
        $('.link-btns').addClass('is-disabled').find('.link-btns__item').prop('disabled', true);

        // 顯示使用者訊息
        showMsg($('#userMsg1'));

        // 思考 → AI 回覆
        setTimeout(showThinking, 400);
        setTimeout(function () {
            showAiReply($('#aiMsg2'));
        }, 400 + THINK_DELAY);
    });

    /* ----- 自定繳款金額輸入判斷 Custom Amount Input ----- */
    var AMOUNT_THRESHOLD = 20000;

    function renderCustomAmountBtns(value) {
        var $btns = $('#customAmountBtns');
        var $card = $('#customAmountCard');

        if (!value || isNaN(value) || value <= 0) {
            $btns.hide().empty();
            return;
        }

        $btns.empty();

        if (value > AMOUNT_THRESHOLD) {
            // 超過 2 萬：只顯示線上繳款
            $btns.append(
                $('<button class="pay-now-card__btn">立即線上繳款</button>')
            );
        } else {
            // 2 萬以內：超商 + 線上
            $btns.append(
                $('<button class="pay-now-card__btn">超商條碼繳款</button>'),
                $('<button class="pay-now-card__btn">立即線上繳款</button>')
            );
        }

        $btns.css('display', 'flex');
    }

    $('#customAmountInput').on('input', function () {
        var val = parseFloat($(this).val());
        renderCustomAmountBtns(val);
    });

    /* ----- Step B-2：下載條碼 → 確認卡 ----- */
    $(document).on('click', '.barcode-card__download', function () {
        $(this).prop('disabled', true).css({ opacity: '0.6', cursor: 'default' });

        showMsg($('#userMsg10'));
        setTimeout(function () { showMsg($('#aiMsg10')); }, 400);
        setTimeout(function () {
            $('#aiMsg10Thinking').hide();
            $('#aiMsg10AvatarThink').hide();
            $('#aiMsg10AvatarIdle').show();
            var $body = $('#aiMsg10Body');
            $body.css('display', 'flex').addClass('is-appear');
            $body.one('animationend', function () { $body.removeClass('is-appear'); });
            scrollToCard($('#aiMsg10'));
        }, 400 + THINK_DELAY);
    });

    /* ----- 重新選擇：回到 aiMsg5 立即繳款卡 ----- */
    $(document).on('click', '.pay-input__btn, .pay-confirm__btn', function () {
        if ($(this).text().trim() !== '重新選擇') return;

        // 隱藏所有後續訊息並重置狀態
        ['#userMsg6','#aiMsg6','#userMsg7','#aiMsg7',
         '#userMsg8','#aiMsg8','#userMsg9','#aiMsg9',
         '#userMsg10','#aiMsg10'].forEach(function (id) {
            var $el = $(id);
            $el.hide();
            $el.find('[id$="Thinking"]').show();
            $el.find('[id$="AvatarThink"]').show();
            $el.find('[id$="AvatarIdle"]').hide();
            $el.find('[id$="Body"]').hide().css('display', '');
        });

        // 重置 pay-now 按鈕
        $('.pay-now-card__btn').prop('disabled', false).css({ opacity: '', cursor: '' });
        // 重置自定金額區
        $('#customAmountBtns').hide().empty();
        $('#customAmountInput').val('');
        // 重新啟用重新選擇 & 相關按鈕
        $('.pay-confirm__btn, .pay-input__btn').prop('disabled', false).css({ opacity: '', cursor: '' });

        // 滾回繳款方式卡
        scrollToCard($('#aiMsg5'));
    });

    /* ----- Step 7：送出表單 → 確認繳款卡 ----- */
    $(document).on('click', '.pay-input__btn', function () {
        if ($(this).text().trim() !== '送出') return;

        $('.pay-input__btn').filter(function () {
            return $(this).text().trim() !== '重新選擇';
        }).prop('disabled', true).css({ opacity: '0.6', cursor: 'default' });

        showMsg($('#userMsg8'));
        setTimeout(function () { showMsg($('#aiMsg6')); }, 400);
        setTimeout(function () {
            $('#aiMsg6Thinking').hide();
            $('#aiMsg6AvatarThink').hide();
            $('#aiMsg6AvatarIdle').show();
            var $body = $('#aiMsg6Body');
            $body.css('display', 'flex').addClass('is-appear');
            $body.one('animationend', function () { $body.removeClass('is-appear'); });
            scrollToCard($('#aiMsg6'));
        }, 400 + THINK_DELAY);
    });

    /* ----- Step 6：確認繳款 → 繳款成功 ----- */
    $(document).on('click', '.pay-confirm__btn', function () {
        if ($(this).text().trim() !== '確認繳款') return;

        // 停用確認卡按鈕
        $('.pay-confirm__btn').filter(function () {
            return $(this).text().trim() !== '重新選擇';
        }).prop('disabled', true).css({ opacity: '0.6', cursor: 'default' });

        showMsg($('#userMsg9'));
        setTimeout(function () { showMsg($('#aiMsg9')); }, 400);
        setTimeout(function () {
            $('#aiMsg9Thinking').hide();
            $('#aiMsg9AvatarThink').hide();
            $('#aiMsg9AvatarIdle').show();
            var $body = $('#aiMsg9Body');
            $body.css('display', 'flex').addClass('is-appear');
            $body.one('animationend', function () { $body.removeClass('is-appear'); });
            scrollToCard($('#aiMsg9'));
        }, 400 + THINK_DELAY);
    });

    /* ----- Step 5：繳款方式選擇（立即線上繳款 / 超商條碼繳款，可重選）----- */
    $(document).on('click', '.pay-now-card__btn:not([disabled])', function () {
        var label = $(this).text().trim();
        if (label !== '立即線上繳款' && label !== '超商條碼繳款') return;

        var isOnline = label === '立即線上繳款';

        // 取得使用者選擇的金額
        var $parentCard = $(this).closest('.pay-now-card');
        var selectedAmount;
        if ($parentCard.attr('id') === 'customAmountCard') {
            // 自定金額：從 input 讀取，格式化為 $ X,XXX
            var rawVal = parseFloat($('#customAmountInput').val()) || 0;
            selectedAmount = '$ ' + rawVal.toLocaleString('zh-TW');
        } else {
            // Card 1 / Card 2：取卡片內的金額文字（去掉全形 ＄，加回半形 $）
            var amtText = $parentCard.find('.pay-now-card__amount-value').text().replace('＄', '').trim();
            selectedAmount = '$ ' + amtText;
        }

        // 將所有後續訊息節點依邏輯順序 re-append 到容器最底部
        // 線上繳款：userMsg6 → aiMsg8(表單) → userMsg8 → aiMsg6(確認) → userMsg9 → aiMsg9(成功)
        // 超商條碼：userMsg7 → aiMsg7(條碼) → userMsg10 → aiMsg10(下載確認)
        var $inner = $('.content-frame__inner');
        ['#userMsg6','#aiMsg8','#userMsg8','#aiMsg6',
         '#userMsg9','#aiMsg9',
         '#userMsg7','#aiMsg7','#userMsg10','#aiMsg10'].forEach(function (id) {
            $inner.append($(id));
        });

        // 隱藏所有後續訊息並重設內部狀態
        $('#userMsg6,#aiMsg6,#userMsg7,#aiMsg7,#userMsg8,#aiMsg8,#userMsg9,#aiMsg9,#userMsg10,#aiMsg10').hide();
        $('#aiMsg6Body,#aiMsg7Body,#aiMsg8Body,#aiMsg9Body,#aiMsg10Body').css('display','none');
        $('#aiMsg6Thinking,#aiMsg7Thinking,#aiMsg8Thinking,#aiMsg9Thinking,#aiMsg10Thinking').show();
        $('#aiMsg6AvatarThink,#aiMsg7AvatarThink,#aiMsg8AvatarThink,#aiMsg9AvatarThink,#aiMsg10AvatarThink').show();
        $('#aiMsg6AvatarIdle,#aiMsg7AvatarIdle,#aiMsg8AvatarIdle,#aiMsg9AvatarIdle,#aiMsg10AvatarIdle').hide();

        // 重新啟用前一個流程中可能已停用的互動按鈕
        $('.pay-confirm__btn, .pay-input__btn').prop('disabled', false).css({ opacity: '', cursor: '' });
        $('.barcode-card__download').prop('disabled', false).css({ opacity: '', cursor: '' });

        // 線上繳款第一步吐出 aiMsg8（輸入表單），超商條碼吐出 aiMsg7（條碼卡）
        var userMsgId     = isOnline ? '#userMsg6' : '#userMsg7';
        var aiMsgId       = isOnline ? '#aiMsg8'   : '#aiMsg7';
        var thinkId       = isOnline ? '#aiMsg8Thinking'    : '#aiMsg7Thinking';
        var avatarThinkId = isOnline ? '#aiMsg8AvatarThink' : '#aiMsg7AvatarThink';
        var avatarIdleId  = isOnline ? '#aiMsg8AvatarIdle'  : '#aiMsg7AvatarIdle';
        var bodyId        = isOnline ? '#aiMsg8Body'        : '#aiMsg7Body';

        showMsg($(userMsgId));
        setTimeout(function () { showMsg($(aiMsgId)); }, 400);
        setTimeout(function () {
            $(thinkId).hide();
            $(avatarThinkId).hide();
            $(avatarIdleId).show();
            var $body = $(bodyId);
            // 寫入使用者選擇的金額
            if (isOnline) {
                $body.find('.pay-input__amount-value').text(selectedAmount);
            } else {
                $body.find('.barcode-card__amount-value').text(selectedAmount);
            }
            $body.css('display', 'flex').addClass('is-appear');
            $body.one('animationend', function () { $body.removeClass('is-appear'); });
            scrollToCard($(aiMsgId));
        }, 400 + THINK_DELAY);
    });

    /* ----- Step 4：立即繳款 ----- */
    $(document).on('click', '.bill-card__footer-btn--active', function () {
        // 停用所有 footer 按鈕
        $('.bill-card__footer-btn').prop('disabled', true).css({ opacity: '0.6', cursor: 'default' });

        // 顯示使用者訊息
        showMsg($('#userMsg5'));

        // 頭像＋思考點點
        setTimeout(function () {
            showMsg($('#aiMsg5'));
        }, 400);

        // 隱藏點點，切換頭像，顯示繳款卡片
        setTimeout(function () {
            $('#aiMsg5Thinking').hide();
            $('#aiMsg5AvatarThink').hide();
            $('#aiMsg5AvatarIdle').show();
            var $body = $('#aiMsg5Body');
            $body.css('display', 'flex').addClass('is-appear');
            $body.one('animationend', function () { $body.removeClass('is-appear'); });
            scrollToCard($('#aiMsg5'));
        }, 400 + THINK_DELAY);
    });

    /* ----- Step 3：驗證方式「APP 驗證」----- */
    $(document).on('click', '.chat-action-card', function () {
        var label = $(this).find('.chat-action-card__title').text().trim();
        if (label !== 'APP 驗證') return;

        // 停用所有驗證方式按鈕
        $('.chat-action-card').prop('disabled', true).css({ opacity: '0.6', cursor: 'default' });

        // ── Face ID 動畫 ──
        var $overlay = $('#faceidOverlay');
        var $wrapper = $('#faceidWrapper');
        var $label   = $('#faceidLabel');

        // 1. 顯示 overlay（GIF 自動播放）
        $overlay.attr('aria-hidden', 'false').addClass('is-visible');

        // 2. 驗證成功文字
        setTimeout(function () {
            $label.addClass('is-success').text('驗證成功');
        }, 1900);

        // 3. 短暫停留後隱藏 overlay，繼續聊天流程
        setTimeout(function () {
            $overlay.addClass('is-hiding');
            setTimeout(function () {
                $overlay.removeClass('is-visible is-hiding').attr('aria-hidden', 'true');
                $label.removeClass('is-success').text('請進行臉部辨識');

                // 顯示使用者訊息
                showMsg($('#userMsg3'));

                // 頭像＋思考點點一起出現
                setTimeout(function () {
                    showMsg($('#aiMsg4'));
                }, 400);

                // 思考後吐出帳單卡片
                setTimeout(function () {
                    $('#aiMsg4Thinking').hide();
                    $('#aiMsg4AvatarThink').hide();
                    $('#aiMsg4AvatarIdle').show();
                    var $body = $('#aiMsg4Body');
                    $body.css('display', 'flex').addClass('is-appear');
                    $body.one('animationend', function () { $body.removeClass('is-appear'); });
                    scrollToCard($('#aiMsg4'));
                }, 400 + THINK_DELAY);
            }, 380);
        }, 2700);
    });

    /* ----- Bill Card Tab Switch / 帳單卡片分頁切換 ----- */
    $(document).on('click', '.bill-card__tab', function () {
        var panel = $(this).data('panel');
        var $card = $(this).closest('.bill-card');

        $card.find('.bill-card__tab').removeClass('is-active');
        $(this).addClass('is-active');

        $card.find('.bill-card__panel').css('display', 'none');
        $card.find('.bill-card__panel[data-panel-id="' + panel + '"]').css('display', 'flex');
    });

    /* ----- Bill Card Transaction Entry Accordion / 交易項目折疊 ----- */
    $(document).on('click', '.bill-card__tx-entry-hd', function () {
        $(this).closest('.bill-card__tx-entry').toggleClass('is-open');
    });

    /* ----- Bill Card Section Accordion / 折疊區 ----- */
    $(document).on('click', '.bill-card__section-hd', function () {
        var $section = $(this).closest('.bill-card__section');
        $section.toggleClass('is-open');
        $(this).find('.bill-card__section-ctrl-text')
               .text($section.hasClass('is-open') ? '收合明細' : '展開明細');
    });

    /* ----- Step 2：選項卡「本期帳單」----- */
    $(document).on('click', '.chat-card__option', function () {
        var label = $(this).text().trim();
        if (label !== '本期帳單') return;

        // 選項按鈕不再可點擊
        $('.chat-card__option').prop('disabled', true).addClass('is-selected');

        // 顯示使用者訊息
        showMsg($('#userMsg2'));

        // 頭像＋思考點點一起出現
        setTimeout(function () {
            showMsg($('#aiMsg3')); // 此時 aiMsg3Body 為 display:none，只有頭像＋點點
        }, 400);

        // 2 秒後：隱藏點點，切換頭像，吐出實際內容
        setTimeout(function () {
            $('#aiMsg3Thinking').hide();
            $('#aiMsg3AvatarThink').hide();
            $('#aiMsg3AvatarIdle').show();
            var $body = $('#aiMsg3Body');
            $body.css('display', 'flex').addClass('is-appear');
            $body.one('animationend', function () { $body.removeClass('is-appear'); });
            scrollToCard($('#aiMsg3'));
        }, 400 + THINK_DELAY);
    });

    /* ============================== */
    /* 篩選 Filter Pickers             */
    /* ============================== */

    var filterOverlayMap = {
        card:     '#filterCardOverlay',
        side:     '#filterSideOverlay',
        date:     '#filterDateOverlay',
        currency: '#filterCurrencyOverlay'
    };

    var filterDefaultLabel = {
        card:     '卡別',
        side:     '正副卡',
        date:     '日期',
        currency: '幣別'
    };

    var SVG_CHEVRON = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var SVG_CLOSE   = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

    function setFilterActive($btn, filterKey, label) {
        $btn.html(label + ' ' + SVG_CLOSE).addClass('is-active');
    }

    function resetFilter($btn, filterKey) {
        $btn.html(filterDefaultLabel[filterKey] + ' ' + SVG_CHEVRON).removeClass('is-active');
        // 重設 popup 列表選取回第一項
        var $list = $(filterOverlayMap[filterKey]).find('.filter-picker__list');
        $list.find('.filter-picker__item').removeClass('is-selected');
        $list.find('.filter-picker__item').first().addClass('is-selected');
        // 重設日期
        if (filterKey === 'date') {
            $('#filterDateFrom').val('2024-07-01');
            $('#filterDateTo').val('2025-01-01');
        }
    }

    // 點篩選 chip：已 active → 取消篩選；未 active → 開啟 popup
    $(document).on('click', '.bill-card__filter', function () {
        var filter = $(this).data('filter');
        if ($(this).hasClass('is-active')) {
            resetFilter($(this), filter);
            return;
        }
        var overlayId = filterOverlayMap[filter];
        if (!overlayId) return;
        $(overlayId).addClass('is-open').attr('aria-hidden', 'false');
    });

    // 關閉：點遮罩
    $(document).on('click', '.filter-overlay', function (e) {
        if (!$(e.target).closest('.filter-picker').length) {
            $(this).removeClass('is-open').attr('aria-hidden', 'true');
        }
    });

    // 關閉：X 按鈕（popup 的關閉按鈕，非 chip 的 X）
    $(document).on('click', '.filter-picker__close', function () {
        $(this).closest('.filter-overlay').removeClass('is-open').attr('aria-hidden', 'true');
    });

    // 選取列表項目 → 更新 filter chip，關閉
    $(document).on('click', '.filter-picker__item', function () {
        var value    = $(this).data('value');
        var $list    = $(this).closest('.filter-picker__list');
        var $overlay = $(this).closest('.filter-overlay');

        $list.find('.filter-picker__item').removeClass('is-selected');
        $(this).addClass('is-selected');

        var filterKey = Object.keys(filterOverlayMap).find(function (k) {
            return filterOverlayMap[k] === '#' + $overlay.attr('id');
        });
        var $btn = $('.bill-card__filter[data-filter="' + filterKey + '"]');
        var isDefault = (value === '全部顯示' || value === '全部');

        if (isDefault) {
            resetFilter($btn, filterKey);
        } else {
            setFilterActive($btn, filterKey, value);
        }

        setTimeout(function () {
            $overlay.removeClass('is-open').attr('aria-hidden', 'true');
        }, 140);
    });

    // 日期確認
    $('#filterDateConfirm').on('click', function () {
        var from = $('#filterDateFrom').val();
        var to   = $('#filterDateTo').val();
        var $btn = $('.bill-card__filter[data-filter="date"]');

        if (from && to) {
            var label = from.replace(/-/g, '/') + '～' + to.replace(/-/g, '/');
            setFilterActive($btn, 'date', label);
        }

        $('#filterDateOverlay').removeClass('is-open').attr('aria-hidden', 'true');
    });

    /* ============================== */
    /* 約定條款 Terms Popup            */
    /* ============================== */

    var $termsOverlay   = $('#termsOverlay');
    var $termsBody      = $('#termsBody');
    var $termsScrollHint = $('#termsScrollHint');
    var $termsAgreeBtn  = $('#termsAgreeBtn');

    function openTerms() {
        // 每次開啟重設捲動位置與按鈕狀態
        $termsBody.scrollTop(0);
        $termsScrollHint.removeClass('is-hidden');
        $termsAgreeBtn.removeClass('is-active').prop('disabled', true);
        $termsOverlay.addClass('is-open').attr('aria-hidden', 'false');
    }

    function closeTerms() {
        $termsOverlay.removeClass('is-open').attr('aria-hidden', 'true');
    }

    function checkTermsScroll() {
        var el = $termsBody[0];
        var atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 10;
        if (atBottom) {
            $termsScrollHint.addClass('is-hidden');
            $termsAgreeBtn.addClass('is-active').prop('disabled', false);
        }
    }

    // 點 checkbox-row → 開啟 popup
    $(document).on('click', '.pay-input__checkbox-row', function () {
        // 已勾選時不重開
        if ($('.pay-input__checkbox').hasClass('is-checked')) return;
        openTerms();
    });

    // X 關閉
    $('#termsClose').on('click', closeTerms);

    // 點遮罩背景關閉
    $termsOverlay.on('click', function (e) {
        if (!$(e.target).closest('.terms-popup').length) closeTerms();
    });

    // 捲動到底 → 解鎖同意按鈕
    $termsBody.on('scroll', checkTermsScroll);

    // 點滑動提示 pill → 自動捲到底
    $termsScrollHint.on('click', function () {
        $termsBody.animate({ scrollTop: $termsBody[0].scrollHeight }, 400);
    });

    // 點同意 → 勾選 checkbox，關閉 popup
    $termsAgreeBtn.on('click', function () {
        if (!$(this).hasClass('is-active')) return;
        $('.pay-input__checkbox').addClass('is-checked');
        closeTerms();
    });

    /* ============================== */
    /* 銀行代碼選擇 Bank Picker         */
    /* ============================== */

    var BANKS = [
        { code: '004', name: '臺灣銀行股份有限公司' },
        { code: '005', name: '臺灣土地銀行' },
        { code: '006', name: '合作金庫商業銀行' },
        { code: '007', name: '第一商業銀行' },
        { code: '008', name: '華南商業銀行' },
        { code: '009', name: '彰化商業銀行' },
        { code: '011', name: '上海商業儲蓄銀行' },
        { code: '012', name: '台北富邦商業銀行' },
        { code: '013', name: '國泰世華商業銀行' },
        { code: '016', name: '高雄銀行' },
        { code: '017', name: '兆豐國際商業銀行' },
        { code: '021', name: '花旗（台灣）商業銀行' },
        { code: '050', name: '臺灣中小企業銀行' },
        { code: '052', name: '渣打國際商業銀行' },
        { code: '053', name: '台中商業銀行' },
        { code: '081', name: '匯豐（台灣）商業銀行' },
        { code: '700', name: '中華郵政股份有限公司' },
        { code: '803', name: '聯邦商業銀行' },
        { code: '805', name: '遠東國際商業銀行' },
        { code: '806', name: '元大商業銀行' },
        { code: '807', name: '永豐商業銀行' },
        { code: '808', name: '玉山商業銀行' },
        { code: '809', name: '凱基商業銀行' },
        { code: '812', name: '台新國際商業銀行' },
        { code: '816', name: '安泰商業銀行' },
        { code: '822', name: '中國信託商業銀行' }
    ];

    var $bankPickerOverlay = $('#bankPickerOverlay');
    var $bankPickerList    = $('#bankPickerList');

    // 動態產生銀行列表
    BANKS.forEach(function (bank) {
        $bankPickerList.append(
            $('<div class="bank-picker__item" tabindex="0">')
                .attr('data-code', bank.code)
                .text(bank.code + ' ' + bank.name)
        );
    });

    function openBankPicker() {
        $bankPickerOverlay.addClass('is-open').attr('aria-hidden', 'false');
    }

    function closeBankPicker() {
        $bankPickerOverlay.removeClass('is-open').attr('aria-hidden', 'true');
    }

    // 點擊搜尋欄開啟
    $(document).on('click', '.pay-input__search-row', openBankPicker);

    // X 按鈕關閉
    $('#bankPickerClose').on('click', closeBankPicker);

    // 點遮罩（picker 外部）關閉
    $bankPickerOverlay.on('click', function (e) {
        if (!$(e.target).closest('.bank-picker').length) {
            closeBankPicker();
        }
    });

    // 選取銀行 → 帶入搜尋欄並關閉
    $bankPickerList.on('click', '.bank-picker__item', function () {
        var text = $(this).text();

        // 更新 selected 高亮
        $bankPickerList.find('.bank-picker__item').removeClass('is-selected');
        $(this).addClass('is-selected');

        // 帶入搜尋欄文字
        $('.pay-input__search-placeholder').text(text);
        $('.pay-input__search-row').addClass('has-value');

        setTimeout(closeBankPicker, 150);
    });

});
