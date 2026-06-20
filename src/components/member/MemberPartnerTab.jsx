import { withTranslation } from "react-i18next";
import React, { Component } from 'react';
import dataApi from "../../services/dataApi";

class MemberPartnerTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      partners: [],
      selectedPartner: null,
      partnerSearch: "",
      partnerPage: 1
    };
  }

  componentDidMount() {
    this.fetchPartners();
  }

  fetchPartners = async () => {
    try {
      const list = await dataApi.getPartners();
      this.setState({ partners: list });
      if (list.length > 0) {
        this.setState({ selectedPartner: list[0] });
      }
    } catch (err) {
      console.error("Failed to load partners in member portal:", err);
    }
  };

  handleSearchChange = (e) => {
    this.setState({ partnerSearch: e.target.value, partnerPage: 1 });
  };

  setPartnerPage = (page) => {
    this.setState({ partnerPage: page });
  };

  setSelectedPartner = (p) => {
    this.setState({ selectedPartner: p });
  };

  render() {
    const { t } = this.props;
    const { partners, selectedPartner, partnerSearch, partnerPage } = this.state;
    
    const filteredPartners = partners.filter(p =>
      p.name.toLowerCase().includes(partnerSearch.toLowerCase())
    );

    const PARTNERS_PER_PAGE = 12;
    const totalPartnerPages = Math.ceil(filteredPartners.length / PARTNERS_PER_PAGE);
    const paginatedPartners = filteredPartners.slice(
      (partnerPage - 1) * PARTNERS_PER_PAGE,
      partnerPage * PARTNERS_PER_PAGE
    );

    return (
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0 animate-fadeIn">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 sm:p-6 md:p-8 border border-zinc-200/50 dark:border-zinc-800/80 shadow-xl flex flex-col justify-between min-h-[500px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-black dark:text-white flex items-center gap-2">{t("memberTabs.partner.title")}</h3>
              <p className="text-[9px] sm:text-xs text-zinc-450 mt-1">{t("memberTabs.partner.desc")}</p>
            </div>

            <span className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border border-zinc-250/20">
              partner.hugowishpax.studio
            </span>
          </div>

          {/* Multi-Partner list */}
          {partners.length > 0 ? (
            <div className="flex flex-col flex-grow mt-4 gap-4">

              {/* Search and Page Stats */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                {/* Search Field */}
                <div className="relative flex-grow max-w-sm">
                  <input
                    type="text"
                    placeholder={t("memberTabs.partner.searchPlaceholder")}
                    value={partnerSearch}
                    onChange={this.handleSearchChange}
                    className="w-full rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs py-2 pl-9 pr-4 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-medium"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
                </div>

                {/* Pagination Indicator */}
                {totalPartnerPages > 1 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-450 uppercase tracking-wider select-none">
                    <button
                      onClick={() => this.setPartnerPage(Math.max(partnerPage - 1, 1))}
                      disabled={partnerPage === 1}
                      className="p-1 rounded bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-800 disabled:opacity-40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[10px] leading-none">chevron_left</span>
                    </button>
                    <span>Trang {partnerPage} / {totalPartnerPages}</span>
                    <button
                      onClick={() => this.setPartnerPage(Math.min(partnerPage + 1, totalPartnerPages))}
                      disabled={partnerPage === totalPartnerPages}
                      className="p-1 rounded bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-800 disabled:opacity-40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[10px] leading-none">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Selector Pills */}
              {paginatedPartners.length > 0 ? (
                <div className="flex flex-wrap gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  {paginatedPartners.map((p) => {
                    let domain = "google.com";
                    try {
                      let url = p.iframeUrl;
                      if (url.includes('<iframe')) {
                        const match = url.match(/src=["']([^"']+)["']/);
                        if (match) url = match[1];
                      }
                      domain = new URL(url).hostname;
                    } catch (e) {
                      // Ignore url parse errors
                    }
                    const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

                    return (
                      <button
                        key={p._id}
                        onClick={() => this.setSelectedPartner(p)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedPartner?._id === p._id
                            ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                            : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300"
                          }`}
                      >
                        <img
                          src={faviconUrl}
                          alt=""
                          onError={(e) => { e.target.style.display = 'none'; }}
                          className="w-4 h-4 rounded-sm object-contain"
                        />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-400 text-xs italic border-b border-zinc-200 dark:border-zinc-800">
                  Không tìm thấy đối tác nào phù hợp.
                </div>
              )}

              {/* Selected Iframe Viewport Container */}
              {selectedPartner && paginatedPartners.some(p => p._id === selectedPartner._id) && (
                <div className="flex-grow w-full bg-white text-black rounded-lg overflow-hidden min-h-[450px] border border-zinc-200/60 dark:border-zinc-800/80 relative z-10 shadow-inner">
                  {selectedPartner.iframeUrl.includes('<iframe') ? (
                    <div
                      className="w-full h-full min-h-[450px] flex [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:min-h-[450px]"
                      dangerouslySetInnerHTML={{ __html: selectedPartner.iframeUrl }}
                    />
                  ) : (
                    <iframe
                      src={selectedPartner.iframeUrl}
                      title="Partner service"
                      className="w-full h-full min-h-[450px]"
                      style={{ border: 'none' }}
                      allowFullScreen
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-3">
              <span className="material-symbols-outlined text-4xl text-zinc-400">handshake</span>
              <h4 className="text-xs font-bold text-zinc-550 dark:text-zinc-400">{t("memberTabs.partner.emptyTitle")}</h4>
              <p className="text-[10px] text-zinc-400 max-w-sm">{t("memberTabs.partner.emptyDesc")}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default withTranslation()(MemberPartnerTab);
