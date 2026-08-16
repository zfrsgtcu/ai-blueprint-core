# Katkıda Bulunma Kılavuzu (Contributing Guide)

`ai-blueprint-core` projesine katkıda bulunmak istediğiniz için teşekkürler! Bu doküman, katkı sürecinin hızlı, verimli ve standartlara uygun olmasını sağlamak için hazırlanmıştır.

---

## 🚀 Katkı Süreci (GitHub PR Workflow)

1. **Projeyi Fork Edin:** Sağ üstteki **Fork** butonuna tıklayarak depoyu kendi GitHub hesabınıza kopyalayın.
2. **Klonlayın:**
   ```bash
   git clone https://github.com/<kullanici-adiniz>/ai-blueprint-core.git
   cd ai-blueprint-core
   ```
3. **Yeni Bir Branch Oluşturun:**
   ```bash
   git checkout -b feat/yeni-stack-veya-ozellik
   # veya
   git checkout -b fix/hata-duzeltme
   ```
4. **Değişikliklerinizi Yapın:**
   - Kod ve JSON format standartlarına dikkat edin.
   - İlgili dokümanları güncelleyin.
5. **Commit Edin:** Anlamlı commit mesajları yazın ([Conventional Commits](https://www.conventionalcommits.org/)):
   - `feat(stacks): add fastapi-postgresql stack template`
   - `fix(mapping): correct subagent resolution for mobile client`
   - `docs(readme): update stack matrix and architecture overview`
6. **Push Edin & PR Açın:**
   ```bash
   git push origin feat/yeni-stack-veya-ozellik
   ```
   GitHub üzerinden ana depoya (upstream) **Pull Request** gönderin.

---

## 🧩 Nasıl Katkı Sağlayabilirsiniz?

### 1. Yeni Bir Stack Şablonu Eklemek
- `stacks/<stack-id>.json` dosyasını oluşturun.
- Gerekli alanları eksiksiz doldurun (`id`, `name`, `type`, `stack`, `uiLibraries`, `departmentPrompts` vb.).
- `agents-stack-mapping.json` dosyasına ilgili eşleşme kuralını ekleyin.
- `stacks/README.md` ve ana `README.md` matris tablosunu güncelleyin.

### 2. Yeni Bir Ajan (Subagent) Eklemek
- `agents/<category>/<subagent-id>.md` dosyasını oluşturun.
- Ajan rolü, sorumlulukları, beklenen girdi ve çıktı formatlarını net biçimde belirtin.
- `agents-stack-mapping.json` içindeki ilgili kategoriye subagent adını ekleyin.

### 3. Yeni Bir Tasarım Deseni Eklemek
- `design-practices/<practice-id>.json` dosyasını oluşturun.
- CSS/UI kurallarını, layout yapısını ve tema değişkenlerini ekleyin.

---

## 📋 Pull Request Kuralları

- [ ] PR başlığı ve açıklaması yapılan değişikliği net olarak açıklamalıdır.
- [ ] Eklenen veya düzenlenen JSON dosyaları geçerli (valid JSON) olmalıdır.
- [ ] Yeni bir stack veya ajan eklendiyse dokümantasyon güncellenmiş olmalıdır.
- [ ] Başka açık olan bir PR veya Issue ile çakışmadığından emin olunmalıdır.
