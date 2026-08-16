/**
 * Feature Development Workflow (Real File Generation)
 *
 * Dinamik pipeline: Stack'e göre agent listesi resolve edilir.
 * Her departman gerçek kod dosyaları oluşturur.
 *
 * Yeni yapı: İki-seviyeli mapping (categories + subagents)
 */

// Stack template yükleme fonksiyonu
async function loadStackConfig(stackId) {
  const stackPaths = [
    `.claude/stacks/${stackId}.json`,
    `../stacks/${stackId}.json`
  ];

  for (const path of stackPaths) {
    try {
      if (typeof globalThis.readStack !== 'function') continue;
      const config = await globalThis.readStack(path);
      return config;
    } catch (e) {
      continue;
    }
  }

  throw new Error(`Stack template bulunamadı: ${stackId}`);
}

// Mapping dosyasını yükleme fonksiyonu
async function loadMappingConfig() {
  const mappingPaths = [
    `.claude/agents-stack-mapping.json`,
    `../agents-stack-mapping.json`
  ];

  for (const path of mappingPaths) {
    try {
      if (typeof globalThis.readStack !== 'function') continue;
      const config = await globalThis.readStack(path);
      return config;
    } catch (e) {
      continue;
    }
  }

  throw new Error(`Agent-stack mapping dosyası bulunamadı: agents-stack-mapping.json`);
}

// Stack'e göre agent listesini resolve et (YENİ: İki-seviyeli yapı)
function resolveAgents(stackConfig, mapping) {
  const frontend = stackConfig.stack?.frontend;
  const backend = stackConfig.stack?.backend;

  for (const rule of mapping.stackAgentRules) {
    const cond = rule.condition;

    // Frontend condition kontrolü
    const feMatches = !cond.frontend || cond.frontend.includes(frontend);

    // Backend condition kontrolü
    const beMatches = !cond.backend || cond.backend.includes(backend);

    if (feMatches && beMatches) {
      return rule.agents; // [{category, subagent}, ...] formatında döner
    }
  }

  throw new Error(
    `Hiçbir agent kurali eslesmedi: frontend=${frontend}, backend=${backend}. ` +
    `Lütfen agents-stack-mapping.json dosyasina yeni bir kural ekleyin.`
  );
}

// Agent definition dosyasini oku (YENİ: categories'den path resolve eder)
async function loadAgentDefinition(mapping, category, subagent) {
  const categoryInfo = mapping.categories[category];

  if (!categoryInfo || !categoryInfo.subagents.includes(subagent)) {
    throw new Error(
      `Invalid agent: category="${category}", subagent="${subagent}". ` +
      `Valid subagents for "${category}": ${categoryInfo?.subagents?.join(', ') || 'N/A'}`
    );
  }

  // Definition file path: agents/{category}/{subagent}.md
  const definitionFile = `agents/${category}/${subagent}.md`;

  try {
    if (typeof globalThis.readStack === 'function') {
      return await globalThis.readStack(definitionFile);
    } else {
      // Fallback: default prompt kullan
      return getDefaultAgentPrompt(category, subagent, mapping);
    }
  } catch (e) {
    log(`⚠️ Agent tanim dosyasi okunamadi: ${definitionFile}, default prompt kullaniliyor.`);
    return getDefaultAgentPrompt(category, subagent, mapping);
  }
}

// Default agent prompt'lar (definition dosyasi yoksa fallback)
function getDefaultAgentPrompt(category, subagent, mapping) {
  const categoryInfo = mapping.categories[category] || {};
  const categoryName = categoryInfo.name || category;
  return `Sen ${categoryName} kategorisinde "${subagent}" alt agent'i rolündesin. Görevini yerine getir.`;
}

// Her agent icin dosya olusturma prompt'unu dinamik olarak oluştur (YENİ: category + subagent)
function buildAgentPrompt(mapping, category, subagent, stackConfig, featureOrTask, projectDir) {
  // Agent tanim dosyasini yükle
  let definitionContent = '';
  try {
    if (typeof globalThis.readStack === 'function') {
      definitionContent = globalThis.readStack(`agents/${category}/${subagent}.md`);
    }
  } catch (e) {
    // Tanim dosyasi yoksa bos birak
  }

  const basePrompt = `# ${category}/${subagent} Agent

## Rol ve Sorumluluklar
${definitionContent || 'Bu agent icin tanim dosyasi bulunamadi.'}

---

## Stack Context

**Stack ID:** ${stackConfig.id}
**Stack Adı:** ${stackConfig.name}
**Frontend Teknolojisi:** ${stackConfig.stack?.frontend}
**Backend Teknolojisi:** ${stackConfig.stack?.backend}
**Veritabani:** ${stackConfig.stack?.database}
**Deploy Hedefi:** ${stackConfig.stack?.deploy}

## UI Kütüphaneleri
${(stackConfig.uiLibraries || []).map(lib => `- ${lib.name} (${lib.usage})`).join('\n')}

## Ek Servisler
${(stackConfig.extraServices || []).map(svc => `- ${svc.name}: ${svc.provider}`).join('\n')}

---

## Görev: ${featureOrTask}

Proje Dizini: ${projectDir}

### Beklenen Çıktı:
- Gerçek kod dosyaları oluştur (placeholder değil, production-ready)
- Her dosyayı tam içerik ile yaz
- Stack konvansiyonlarina uygun ol
`;

  // Departman prompt'u varsa ekle (category bazlı)
  const deptPrompt = stackConfig.departmentPrompts?.[category];
  if (deptPrompt) {
    return `${basePrompt}\n\n## Özel Talimatlar:\n${deptPrompt}`;
  }

  return basePrompt;
}

// Her agent icin schema tanimi (YENİ: categories'e göre)
function getAgentSchema(category, subagent) {
  const schemas = {
    backend: {
      type: 'object',
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        apiEndpoints: { type: 'array', items: { type: 'string' } },
        databaseChanges: { type: 'string' }
      },
      required: ['filesCreated']
    },
    frontend: {
      type: 'object',
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        componentTree: { type: 'string' },
        responsiveBreakpoints: { type: 'string' }
      },
      required: ['filesCreated']
    },
    mobile: {
      type: 'object',
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        screens: { type: 'array', items: { type: 'string' } },
        nativeModules: { type: 'array', items: { type: 'string' } }
      },
      required: ['filesCreated']
    },
    qa: {
      type: 'object',
      properties: {
        testCoverage: { type: 'object' },
        bugsFound: { type: 'array', items: { type: 'string' } },
        securityScanResults: { type: 'string' }
      },
      required: ['testCoverage']
    },
    devops: {
      type: 'object',
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        cicdPipeline: { type: 'string' },
        deploymentConfig: { type: 'string' }
      },
      required: ['filesCreated']
    },
    'project-manager': {
      type: 'object',
      properties: {
        userStories: { type: 'array', items: { type: 'string' } },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        nfrs: { type: 'array', items: { type: 'string' } }
      },
      required: ['userStories']
    }
  };

  return schemas[category] || schemas.backend; // default to backend schema
}

// Agent'i calistir ( Yardimci fonksiyon)
async function executeAgent(mapping, agent, stackConfig, featureOrTask, projectDir) {
  const { category, subagent } = agent;

  log(`\n🚀 ${category}/${subagent} calistiriliyor...`);

  // departmentPrompts'ta null olan agent'lari skip et
  if (!stackConfig.departmentPrompts?.[category]) {
    log(`  ⏭️ Atlaniyor: ${category}/${subagent} (bu stack icin tanimli degil)`);
    return null;
  }

  // Agent prompt'unu oluştur
  const agentPrompt = buildAgentPrompt(
    mapping, category, subagent, stackConfig, featureOrTask, projectDir
  );

  // Agent'i çalıştır
  try {
    const result = await agent(agentPrompt, {
      label: `${category}/${subagent}`,
      phase: `Feature Development (${stackConfig.name})`,
      schema: getAgentSchema(category, subagent)
    });

    log(`  ✅ Tamamlandi.`);
    return result;
  } catch (error) {
    log(`  ❌ Hata: ${error.message}`);
    return { error: error.message };
  }
}

// Ana workflow fonksiyonu (YENİ: serial/parallel execution desteği)
export async function main() {
  // Stack ve proje konfigürasyonunu yükle
  const stackId = args.stack || args.projectConfig?.stack;
  if (!stackId) {
    throw new Error('Stack belirtilmedi. --stack parametresi ile bir stack seçin.');
  }

  log(`📦 Stack yükleniyor: ${stackId}...`);
  const stackConfig = await loadStackConfig(stackId);
  log(`✅ Stack yüklendi: ${stackConfig.name}`);

  // Mapping dosyasini yükle
  log('🔗 Agent-stack mapping yapisi yükleniyor...');
  const mapping = await loadMappingConfig();
  log(`✅ Mapping yüklendi (${Object.keys(mapping.categories || {}).length} kategori tanimli)`);

  // Stack'e göre agent listesini resolve et
  const resolvedAgents = resolveAgents(stackConfig, mapping);

  // Agent'ları kategorilere göre grupla
  const agentsByCategory = {};
  for (const agent of resolvedAgents) {
    if (!agentsByCategory[agent.category]) {
      agentsByCategory[agent.category] = [];
    }
    agentsByCategory[agent.category].push(agent);
  }

  log(`🎯 Agirilan agent listesi: [${resolvedAgents.map(a => `${a.category}/${a.subagent}`).join(', ')}]`);

  // Proje dizinini belirle (args.projectDir veya default)
  const projectDir = args.projectDir || `my-project`;

  // Feature/task bilgisini al
  const featureOrTask = args.feature || args.task;
  if (!featureOrTask) {
    throw new Error('Feature/task belirtilmedi. --feature parametresi ile bir özellik belirtin.');
  }

  log(`🎯 Hedef: ${featureOrTask}`);
  log(`📁 Proje Dizini: ${projectDir}`);

  // Her kategori icin: serial/parallel execution → aggregate results
  const results = {};

  for (const [category, subagents] of Object.entries(agentsByCategory)) {
    const categoryConfig = mapping.categories[category];
    const executionMode = categoryConfig?.execution || 'serial';

    log(`\n📂 Kategori: ${category} (${executionMode})`);

    if (executionMode === 'parallel') {
      // PARALLEL EXECUTION: Tüm subagent'lar aynı anda çalışır
      log(`  ⚡ Parallel execution başlatılıyor...`);

      const parallelResults = await Promise.all(
        subagents.map(agent =>
          executeAgent(mapping, agent, stackConfig, featureOrTask, projectDir)
        )
      );

      // Sonuçları aggregate et
      for (let i = 0; i < subagents.length; i++) {
        const key = `${subagents[i].category}/${subagents[i].subagent}`;
        results[key] = parallelResults[i];
      }
    } else {
      // SERIAL EXECUTION: Subagent'lar sırayla çalışır (varsayılan)
      for (const agent of subagents) {
        const result = await executeAgent(
          mapping, agent, stackConfig, featureOrTask, projectDir
        );

        const key = `${agent.category}/${agent.subagent}`;
        results[key] = result;
      }
    }
  }

  // Özet rapor oluştur (YENİ: category bazlı)
  const summary = `
## 📊 Workflow Özet Raporu

**Proje:** ${stackConfig.name}
**Stack:** ${JSON.stringify(stackConfig.stack)}
**Hedef:** ${featureOrTask}
**Calistirilan Agent'lar:** [${resolvedAgents.map(a => `${a.category}/${a.subagent}`).join(', ')}]

### ✅ Oluşturulan Dosyalar (Kategori Bazlı):
${Object.entries(results).map(([key, result]) => {
  if (!result || !result.filesCreated) return '';
  const [cat, sub] = key.split('/');
  return `#### ${cat}/${sub} Agent:\n${result.filesCreated.map(f => `- ${projectDir}/${f}`).join('\n')}`;
}).filter(Boolean).join('\n\n')}

---
🚀 **Sonraki Adım**: Projeyi test etmek için \`cd ${projectDir} && npm run dev\` komutunu kullanabilirsiniz.
`;

  log(summary);

  return results;
}

// ES modules export (modern Node.js uyumlu)
export default main;
export {
  loadStackConfig,
  loadMappingConfig,
  resolveAgents,
  buildAgentPrompt,
  getAgentSchema,
  executeAgent,
  loadAgentDefinition
};
