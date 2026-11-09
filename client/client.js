window.__ModuleLoader__.load({
	id: "dsh-market-groups",
	factory: (require) => {

		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const REQUIRED_PRIMITIVES = [];
		const name = "dsh-market-groups";
		try { window.__dshMarketGroupsPlugin = "0.1.0"; } catch (error) {}

		/** 把市场 API 路径解析到当前页面的挂载点（与市场内部同款实现，支持反向代理前缀）。 */
		function api(path) {
			const relative = String(path).replace(/^\/+/, "");
			if (typeof document === "undefined") return "/" + relative;
			return new URL(relative, document.baseURI).pathname;
		}
		/* ── 增强补丁：冲突高亮 + 按类别分组（追加层，不改原逻辑） ─────────────
		 * 只做加法：状态自持有、请求走已有接口、失败一律吞掉，绝不阻断市场渲染。
		 */
		try {
			installMarketEnhancements();
		}
		catch (marketEnhanceError) {
			console.warn("[dsh-market] enhancement init failed", marketEnhanceError);
		}
		function installMarketEnhancements() {
			if (typeof document === "undefined" || typeof window === "undefined") return;
			try { window.localStorage.setItem("dshm:plugin:v1", "0.1.0"); } catch (error) {}
			if (window.__dshMarketEnhancements) return;
			window.__dshMarketEnhancements = true;
			const ROOT = "[data-dsh-market-root]";
			const ROWS_SELECTORS = [
				".nUhMVa_groupMember", ".nUhMVa_irow", ".nUhMVa_card", ".nUhMVa_ungroupedRow",
				"[class*=_groupMember]", "[class*=_irow]", "[class*=_card]"
			];
			const ROWS = ROWS_SELECTORS.join(",");
			const NAME = "[class*=nUhMVa_nm],[class*=_nm],[class*=_name]";
			const CATEGORY_LABELS = {
				agi: "AGI 架构探索",
				ui: "界面增强",
				usage: "用量与计费",
				theme: "主题与外观",
				model: "模型与账号接入",
				identity: "身份与通信",
				session: "会话与消息",
				memory: "记忆",
				tools: "工具与能力",
				wsl: "WSL 与 Windows",
				browser: "浏览器与网页",
				vision: "视觉与多模态",
				voice: "语音与音频",
				docs: "文档与渲染",
				skill: "技能包",
				workflow: "流程与自动化",
				git: "Git 与代码审查",
				notify: "通知与集成",
				dev: "开发与运行时",
				security: "安全与权限",
				remote: "远程与移动",
				market: "插件市场与管理",
				fun: "趣味"
			};
			const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);
			const WARNED = /* @__PURE__ */ new Set();
			function warnOnce(message) {
				if (WARNED.has(message)) return;
				WARNED.add(message);
				console.warn("[dsh-market] " + message);
			}
			function readFlag(key, fallback) {
				try {
					const value = window.localStorage.getItem(key);
					if (value === null) return fallback;
					return value === "1" || value === "true";
				}
				catch {
					return fallback;
				}
			}
			/** 市场改版时的唯一改动点：上面 ROWS_SELECTORS / NAME，以及这里的按钮文案。 */
			const TEXT_GROUPS = /^(分组|Groups?|グループ|그룹)$/i;
			const TEXT_NEW_GROUP = /新建分组|New group|新しいグループ|그룹 만들기/i;
			const state = { peers: /* @__PURE__ */ new Map(), details: /* @__PURE__ */ new Map(), severity: /* @__PURE__ */ new Map(), rows: -1, checkedAt: 0, pending: null, timer: 0, mutating: false, classified: false };
			injectStyles();
			new MutationObserver(() => schedule()).observe(document.documentElement, { childList: true, subtree: true });
			document.addEventListener("pointerover", onPointerOver, true);
			document.addEventListener("pointerout", onPointerOut, true);
			refresh(true);
			function injectStyles() {
				if (document.getElementById("dshm-enhance-style")) return;
				const style = document.createElement("style");
				style.id = "dshm-enhance-style";
				style.textContent = ".dshm-cf-row{box-shadow:inset 3px 0 0 #e5484d}" + ".dshm-cf-badge{display:inline-flex;align-items:center;margin-left:6px;padding:0 5px;height:15px;border-radius:8px;font-size:10px;line-height:15px;color:#fff;background:#e5484d;vertical-align:middle;cursor:help;flex:none}" + ".dshm-dep-row{box-shadow:inset 3px 0 0 #d97706}" + ".dshm-dep-badge{display:inline-flex;align-items:center;margin-left:6px;padding:0 5px;height:15px;border-radius:8px;font-size:10px;line-height:15px;color:#fff;background:#d97706;vertical-align:middle;cursor:help;flex:none}" + ".dshm-cf-peer{background:rgba(229,72,77,.10)!important;box-shadow:inset 3px 0 0 #e5484d,0 0 0 1px rgba(229,72,77,.45)!important}" + ".dshm-classify{margin-left:8px;height:26px;padding:0 10px;border-radius:6px;border:1px solid rgba(0,0,0,.12);background:transparent;color:inherit;font-size:12px;cursor:pointer;flex:none}" + ".dshm-classify:hover{border-color:#e5484d;color:#e5484d}";
				document.head.appendChild(style);
			}
			function schedule(immediate) {
				if (state.mutating || state.timer !== 0) return;
				state.timer = setTimeout(() => {
					state.timer = 0;
					decorate();
				}, immediate === true ? 40 : 180);
			}
			let panelMounted = false;
			function decorate() {
				const root = document.querySelector(ROOT);
				if (root === null) {
					panelMounted = false;
					return;
				}
				state.mutating = true;
				try {
					if (!panelMounted) {
						panelMounted = true;
						ensureGroupedView(root);
					}
					ensureClassifyButton(root);
					renameUngrouped(root);
					const rows = root.querySelectorAll(ROWS);
					if (rows.length === 0) warnOnce("没找到插件行：市场可能改版，改 ROWS_SELECTORS 即可");
					for (const row of rows) {
						const nameEl = row.querySelector(NAME);
						const name = nameEl === null ? "" : String(nameEl.textContent || "").trim();
						if (name === "") continue;
						const peers = state.peers.get(name);
						if (peers === undefined || peers.length === 0) {
							clearRow(row);
							continue;
						}
						const hard = state.severity.get(name) !== "soft";
						row.classList.add(hard ? "dshm-cf-row" : "dshm-dep-row");
						row.dataset.dshmName = name;
						row.dataset.dshmPeers = peers.join("\u0001");
						const badgeClass = hard ? "dshm-cf-badge" : "dshm-dep-badge";
						let badge = row.querySelector(".dshm-cf-badge,.dshm-dep-badge");
						if (badge === null) {
							badge = document.createElement("span");
							nameEl.insertAdjacentElement("afterend", badge);
						}
						if (badge.className !== badgeClass) badge.className = badgeClass;
						badge.textContent = hard ? "冲突" : "同依赖";
						badge.title = (state.details.get(name) || []).join("\n");
					}
				}
				finally {
					state.mutating = false;
				}
			}
			function clearRow(row) {
				if (!row.classList.contains("dshm-cf-row") && !row.classList.contains("dshm-dep-row") && row.dataset.dshmName === undefined) return;
				row.classList.remove("dshm-cf-row", "dshm-dep-row");
				delete row.dataset.dshmName;
				delete row.dataset.dshmPeers;
				const badge = row.querySelector(".dshm-cf-badge,.dshm-dep-badge");
				if (badge !== null) badge.remove();
			}
			function renameUngrouped(root) {
				for (const el of root.querySelectorAll("span,div,h2,h3,h4,button")) {
					if (el.children.length !== 0) continue;
					const text = String(el.textContent || "").trim();
					if (text.length > 16) continue;
					const hit = /^(未分组|Ungrouped|未グループ)(\s|$)/.exec(text);
					if (hit === null) continue;
					el.textContent = "通用" + text.slice(hit[1].length);
				}
			}
			function ensureGroupedView(root) {
				const buttons = root.querySelectorAll("button");
				let target = null;
				for (const button of buttons) {
					const text = String(button.textContent || "").trim();
					if (!TEXT_GROUPS.test(text)) continue;
					const pressed = button.getAttribute("aria-pressed") === "true" || /active|selected|current/i.test(String(button.className || ""));
					if (pressed) return;
					target = button;
				}
				if (target === null) return;
				target.click();
			}
			function ensureClassifyButton(root) {
				if (root.querySelector(".dshm-classify") !== null) return;
				let anchor = null;
				for (const button of root.querySelectorAll("button")) {
					if (TEXT_NEW_GROUP.test(String(button.textContent || ""))) {
						anchor = button;
						break;
					}
				}
				if (anchor === null) return;
				const button = document.createElement("button");
				button.type = "button";
				button.className = "dshm-classify";
				button.textContent = "按类别分组";
				button.title = "按精选目录的类别，把还没分组的插件一次性归入对应分组；手动分好的不会被动。";
				button.addEventListener("click", onClassify);
				anchor.insertAdjacentElement("afterend", button);
			}
			async function onClassify(event) {
				const button = event.currentTarget;
				if (button.dataset.busy === "1") return;
				button.dataset.busy = "1";
				button.textContent = "正在分组…";
				try {
					const result = await classifyNow();
					button.textContent = "已归入 " + result.assigned + " 个，刷新中…";
					window.setTimeout(() => window.location.reload(), 800);
				}
				catch (error) {
					button.textContent = "分组失败";
					button.title = String(error && error.message ? error.message : error);
					window.setTimeout(() => {
						button.textContent = "按类别分组";
						button.dataset.busy = "";
					}, 2600);
				}
			}
			async function readJson(path, init) {
				const response = await fetch(api(path), init);
				if (response.ok !== true) throw new Error(path + " → HTTP " + response.status);
				return response.json();
			}
			function groupFor(categories) {
				if (!Array.isArray(categories)) return null;
				for (const category of categories) {
					if (typeof category !== "string") continue;
					const label = CATEGORY_LABELS[category];
					if (label !== undefined) return label;
				}
				return null;
			}
			/** 用市场已有的分组接口做分类：先建组，再逐组写成员。 */
			async function classifyNow() {
				const [registryBody, installed] = await Promise.all([
					readJson("/dsh-market/registry"),
					readJson("/dsh-market/installed")
				]);
				const registry = (registryBody && registryBody.registry) || {};
				const names = Object.keys((installed && installed.installed) || {});
				const groups = Object.assign({}, (installed && installed.groups) || {});
				const index = /* @__PURE__ */ new Map();
				for (const plugin of (Array.isArray(registry.plugins) ? registry.plugins : [])) {
					for (const key of [plugin && plugin.npm, plugin && plugin.name]) {
						if (typeof key === "string" && key !== "" && !index.has(key)) index.set(key, plugin);
					}
				}
				const grouped = new Set();
				for (const members of Object.values(groups)) for (const member of members) grouped.add(member);
				const plan = [];
				for (const name of names) {
					if (name === "dsh-market" || name === "dshmarket" || grouped.has(name)) continue;
					const categories = (index.get(name) || {}).category;
					if (!readFlag("dshm:include-theme", false) && Array.isArray(categories) && categories.includes("theme")) continue;
					const group = groupFor(categories);
					if (group !== null) plan.push({ name, group });
				}
				const post = (body) => readJson("/dsh-market/groups", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body)
				});
				const wanted = [...new Set(plan.map((entry) => entry.group))];
				wanted.sort((left, right) => CATEGORY_ORDER.indexOf(left) - CATEGORY_ORDER.indexOf(right));
				for (const group of wanted) {
					if (groups[group] !== void 0) continue;
					const created = await post({ action: "create", name: group });
					if (created && created.ok !== true) throw new Error(String(created.error || "create failed"));
					groups[group] = [];
				}
				const byGroup = /* @__PURE__ */ new Map();
				for (const entry of plan) {
					if (!byGroup.has(entry.group)) byGroup.set(entry.group, new Set(groups[entry.group] || []));
					byGroup.get(entry.group).add(entry.name);
				}
				for (const [group, members] of byGroup) {
					const saved = await post({ action: "set-members", name: group, members: [...members] });
					if (saved && saved.ok !== true) throw new Error(String(saved.error || "set-members failed"));
				}
				return { assigned: plan.length, created: wanted.length };
			}
			async function refresh(force) {
				if (force !== true && Date.now() - state.checkedAt < 20000) return;
				if (state.pending !== null) return;
				state.pending = (async () => {
					const [installed, check] = await Promise.all([
						readJson("/dsh-market/installed"),
						readJson("/dsh-market/check")
					]);
					const names = new Set(Object.keys((installed && installed.installed) || {}));
					const peers = /* @__PURE__ */ new Map();
					const details = /* @__PURE__ */ new Map();
					const severity = /* @__PURE__ */ new Map();
					const add = (left, right, label, detail, level) => {
						if (typeof left !== "string" || typeof right !== "string" || left === "" || right === "" || left === right) return;
						const hard = level !== "soft";
						for (const pair of [[left, right], [right, left]]) {
							const self = pair[0];
							const other = pair[1];
							if (!names.has(self) || !names.has(other)) continue;
							if (!peers.has(self)) peers.set(self, []);
							const list = peers.get(self);
							if (!list.includes(other)) list.push(other);
							if (!details.has(self)) details.set(self, []);
							details.get(self).push(label + "：" + detail);
							if (hard || !severity.has(self)) severity.set(self, hard ? "hard" : "soft");
						}
					};
					const collect = (item) => {
						const out = [];
						for (const key of ["layers", "names", "plugins", "entries", "members"]) {
							const value = item && item[key];
							if (!Array.isArray(value)) continue;
							for (const entry of value) {
								if (typeof entry === "string") out.push(entry);
								else if (entry && typeof entry.name === "string") out.push(entry.name);
								else if (entry && typeof entry.plugin === "string") out.push(entry.plugin);
							}
						}
						return out;
					};
					for (const item of (Array.isArray(check.duplicates) ? check.duplicates : [])) {
						const list = collect(item);
						for (const left of list) for (const right of list) add(left, right, "重复加载", "cordis 条目 id 重复：" + String((item && item.id) ?? ""));
					}
					for (const item of (Array.isArray(check.duplicateNames) ? check.duplicateNames : [])) {
						const list = collect(item).filter((name) => names.has(name));
						for (const left of list) for (const right of list) add(left, right, "同依赖", "两个插件各自带了一份 " + String(item && item.name) + "，可能版本不一致", "soft");
					}
					for (const item of (Array.isArray(check.multiVersion) ? check.multiVersion : [])) {
						const list = [...new Set(collect(item))].filter((name) => names.has(name));
						for (const left of list) for (const right of list) add(left, right, "多版本共存", String(item && item.name) + " 同时存在多个版本");
					}
					for (const item of (Array.isArray(check.peerMismatches) ? check.peerMismatches : [])) {
						if (!item || item.satisfied !== false) continue;
						add(item.plugin, item.name, "版本冲突", String(item.plugin) + " 需要 " + String(item.name) + " " + String(item.range) + "，实际装的是 " + String(item.resolved));
					}
					for (const item of (Array.isArray(check.orderConflicts) ? check.orderConflicts : [])) {
						if (!item || typeof item.name !== "string") continue;
						const reason = String(item.reason || "");
						for (const name of names) {
							if (name !== item.name && reason.includes(name)) add(item.name, name, "加载顺序", reason);
						}
					}
					try {
						if (new URLSearchParams(window.location.search).get("dshm-demo") === "conflicts") {
							const sample = [...names].slice(0, 4);
							for (const left of sample) for (const right of sample) add(left, right, "示例冲突", "用于验证高亮管线，并非真实冲突");
						}
					}
					catch {
						// 自检开关解析失败时忽略
					}
					state.peers = peers;
					state.details = details;
					state.severity = severity;
					state.checkedAt = Date.now();
					// 首次运行：整个 profile 一个分组都没有时，按类别铺一次，
					// 让「分组」视图开箱即有内容；之后只在用户点按钮时重跑。
					try {
						const nothing = Object.keys((installed && installed.groups) || {}).length === 0;
						const marker = "dshm:auto-classified:v1";
						if (nothing && names.size > 3 && window.localStorage.getItem(marker) !== "1") {
							window.localStorage.setItem(marker, "1");
							state.classified = true;
							const result = await classifyNow();
							if (result.assigned > 0) window.setTimeout(() => window.location.reload(), 1200);
						}
					}
					catch (error) {
						console.warn("[dsh-market] auto-classify skipped", error);
					}
				})();
				try {
					await state.pending;
				}
				finally {
					state.pending = null;
					schedule(true);
				}
			}
			function onPointerOver(event) {
				const target = event.target;
				if (!(target instanceof Element)) return;
				const row = target.closest("[data-dshm-name]");
				if (row === null) return;
				const peers = state.peers.get(row.dataset.dshmName) || [];
				if (peers.length === 0) return;
				for (const node of document.querySelectorAll("[data-dshm-name]")) {
					if (peers.includes(node.dataset.dshmName)) node.classList.add("dshm-cf-peer");
				}
			}
			function onPointerOut(event) {
				const target = event.target;
				if (!(target instanceof Element) || target.closest("[data-dshm-name]") === null) return;
				for (const node of document.querySelectorAll(".dshm-cf-peer")) node.classList.remove("dshm-cf-peer");
			}
		}

		function apply() {
			installMarketEnhancements();
		}
		function inject() {
			return {};
		}
		function missingPrimitives() {
			return [];
		}
		exports.REQUIRED_PRIMITIVES = REQUIRED_PRIMITIVES;
		exports.apply = apply;
		exports.inject = inject;
		exports.missingPrimitives = missingPrimitives;
		exports.name = name;
		return module.exports;
	}
});
