const fs = require('fs');
let code = fs.readFileSync('src/pages/MemberPortalPage.jsx', 'utf8');

code = code.replace(
  /hobbies: "",/g,
  `hobbies: "",\n    height: "",\n    weight: "",\n    measurements: "",\n    address: "",`
);

code = code.replace(
  /hobbies: b\.hobbies \|\| "",/g,
  `hobbies: b.hobbies || "",\n            height: b.height || "",\n            weight: b.weight || "",\n            measurements: b.measurements || "",\n            address: b.address || "",`
);

// Add the fields to the UI below hobbies (around line 930)
const uiRegex = /<div className="space-y-1\.5">[\s\S]*?name="hobbies"[\s\S]*?<\/div>/;
const uiMatch = code.match(uiRegex);
if (uiMatch) {
  const newUI = uiMatch[0] + `

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-2">Địa Chỉ / Khu vực làm việc</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="VD: TP. Hồ Chí Minh"
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl text-[13px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0071e3] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-2">Chiều cao</label>
                        <input
                          type="text"
                          name="height"
                          value={formData.height}
                          onChange={handleInputChange}
                          placeholder="VD: 1m75"
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl text-[13px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0071e3] transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-2">Cân nặng</label>
                        <input
                          type="text"
                          name="weight"
                          value={formData.weight}
                          onChange={handleInputChange}
                          placeholder="VD: 65kg"
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl text-[13px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0071e3] transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-2">Số đo 3 vòng</label>
                        <input
                          type="text"
                          name="measurements"
                          value={formData.measurements}
                          onChange={handleInputChange}
                          placeholder="VD: 90-60-90"
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl text-[13px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#0071e3] transition-all"
                        />
                      </div>
                    </div>`;
  code = code.replace(uiRegex, newUI);
}

fs.writeFileSync('src/pages/MemberPortalPage.jsx', code, 'utf8');
console.log("Updated MemberPortalPage.jsx UI");
