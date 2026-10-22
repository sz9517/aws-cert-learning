---
sidebar_position: 6.5
title: "Analytics: Athena, Glue, Redshift & QuickSight"
---

# Mining insights from a pile of data: just know who these services are

> Many exam questions follow the same storyline: "I have a mountain of data (logs, transaction records, files) and I want to pull useful insights out of it — which service do I use?" This page does not go deep into operations. As long as you **recognize what each analytics service is for**, you can confidently answer the SAA analytics-selection questions.

<Vocab title="📌 Jargon you'll see on this page (fine even if you've never touched AWS)">

- **Data Lake**: a huge warehouse where you "**just dump all kinds of data as-is**". You don't tidy it up first; later, when you need to analyze, you point different tools at it. On AWS this is usually **S3**.
- **ETL (Extract / Transform / Load)**: the whole pipeline that **pulls data from a source, cleans and reshapes it into a useful format, then loads it** into where you analyze it.
- **Data Warehouse**: a database built specifically for **analytics and reporting**; great at running big, complex queries.
- **OLTP vs OLAP**: **OLTP** is "**transactional**" — it handles individual day-to-day inserts/updates (placing an order, transferring money); **OLAP** is "**analytical**" — it handles large-scale statistics and aggregations (e.g. "revenue trend by region over the past three years").
- **BI (Business Intelligence)**: turning analysis results into **charts and dashboards** for people to look at and make decisions.
- **Columnar storage**: data stored **by column** rather than by whole row, which makes "scan a few columns across a huge range and aggregate" very fast — a hallmark of data warehouses.

</Vocab>

:::note[💬 Reading tip]
Whenever you see a term with a <Term desc="Like this! Hover over any dotted term (tap on mobile) and a plain explanation pops up.">dotted underline</Term>, hover over it for a plain-language explanation. All terms are also collected in the [Glossary & Services](/glossary).
:::

## First, the big picture: a data lake centered on S3

These analytics services don't work in isolation — they often revolve around the same center, and that center is **S3**.

Think of **S3 as the data lake**: every source (application logs, IoT telemetry, transaction records, exported files) gets dumped into S3 first, without worrying about format. When it's time to analyze, you **pick the right tool to read that same data**: query it directly with SQL using Athena, clean and transform it first with Glue, load it into Redshift for large-scale warehouse reporting, and finally paint the results into dashboards with QuickSight.

<Analogy title="🏢 Analogy: one big ingredient warehouse, served by different kitchens and tools">

- **S3 data lake = a big ingredient warehouse**: ingredients (raw data) arrive from everywhere and go straight into cold storage, no washing or chopping required first.
- **Athena = a quick taste-test on the spot**: want to know what's in a crate? Check it right there, no need to haul it into a kitchen; ask your question and leave.
- **Glue = the central prep kitchen**: it washes, chops, sorts, and labels ingredients (ETL plus a catalog) so anyone downstream can use them easily.
- **Redshift = the big professional kitchen**: it takes large banquet orders (complex reports) and processes huge volumes of ingredients into a feast at once.
- **QuickSight = plating and serving**: it presents the finished results beautifully to the guests (charts and dashboards).

</Analogy>

## Four main characters, one line of positioning each

### Athena: serverless, query S3 directly with SQL

<Term en="Amazon Athena" desc="A serverless interactive query service that queries data in S3 directly with standard SQL, billed by the amount of data scanned, with no database or servers to manage.">Athena</Term>'s selling point is "**set nothing up, just run SQL against S3**". It is **serverless**: no cluster to manage, no database to create up front — you leave data in S3 and Athena queries it directly with standard SQL. Billing is **by the amount of data each query scans**, so you pay only for what you query and nothing when idle. The classic use case is an **ad hoc query over logs or files sitting in S3**.

### AWS Glue: serverless ETL plus a Data Catalog

<Term en="AWS Glue" desc="A serverless ETL service that extracts, cleans, and transforms data; its built-in Data Catalog centralizes metadata for query engines like Athena and Redshift.">AWS Glue</Term> does two things. First, **serverless ETL**: it **extracts, cleans, and transforms** raw data into a tidy, usable format — again with no servers to manage. Second, a **Data Catalog**: it builds a "**metadata catalog**" of your data (which columns exist, their types, where they live), and that catalog can be used directly by query engines like Athena and Redshift so they know how to read your data. In short: **Glue tidies the data up and registers it in a catalog**.

### Redshift: cloud data warehouse for large, complex analytics

<Term en="Amazon Redshift" desc="AWS's cloud data warehouse, using columnar storage, built for complex analytical queries (OLAP) and business reporting over petabyte-scale data.">Redshift</Term> is AWS's **cloud data warehouse**. It uses **columnar storage** and is built specifically for "**big, complex analytical queries**", handling up to **petabyte-scale** data — the go-to for **business reports and complex aggregations**. One distinction worth nailing down is the difference from RDS:

| Aspect | RDS (relational database) | Redshift (data warehouse) |
| --- | --- | --- |
| Type | **OLTP** (transactional) | **OLAP** (analytical) |
| Good at | Individual inserts/updates/reads (orders, transfers) | Large-scale statistics, aggregation, reporting queries |
| Data scenario | Day-to-day operational data | Huge historical data (up to petabyte scale) |
| Storage | Row-oriented | **Columnar** |

In one line: **use RDS for day-to-day transactions, Redshift for large-scale analytical reporting**.

### QuickSight: turn analysis results into dashboards

<Term en="Amazon QuickSight" desc="AWS's serverless BI service that turns analysis results into interactive charts and dashboards for people to view and make decisions.">QuickSight</Term> is AWS's **BI visualization** service. After the other services have queried and crunched the data, QuickSight is what **turns the results into interactive charts and dashboards** to put in front of managers or customers. It connects to sources like Athena, Redshift, RDS, and S3. Whenever a question talks about "**make it a chart or dashboard for people to look at**", the answer is QuickSight.

## Other analytics services that get a mention (just know the positioning)

| Service | One-line positioning |
| --- | --- |
| **OpenSearch** | **Log search and analytics** — great for full-text search, real-time log queries, and operational metrics |
| **EMR** | Big-data clusters running **Hadoop / Spark**, for very large-scale custom processing |
| **Kinesis** | Ingesting and processing **real-time streaming** data (covered in the dedicated [Streaming & Decoupling](/saa/domain-3/streaming-decoupling) page, not repeated here) |

## The one selection table that matters most

| Your need | Pick this |
| --- | --- |
| Want to **query logs/files in S3 directly with SQL**, no database, serverless | **Athena** |
| Need **ETL** (clean and transform data) or to **build a metadata catalog** | **Glue** |
| Need a **large-scale data warehouse for complex OLAP reports** (petabyte scale) | **Redshift** |
| Need to turn results into **charts and dashboards** | **QuickSight** |

:::tip[💡 Exam key point]
Map the keywords straight to the answer — these are nearly free points:
- The question says **serverless, no database to build, query logs in S3 directly with SQL** → **Athena**
- The question says **need a data warehouse for complex OLAP analytical reports, petabyte-scale data** → **Redshift**
- The question says **do ETL / build a Data Catalog of metadata** → **Glue**
- The question says **turn analysis results into a dashboard for people** → **QuickSight**
- An **OLTP vs OLAP** distinction shows up: day-to-day transactions are RDS (OLTP), analytical reporting is Redshift (OLAP)
:::

## How it works (diagram)

<div className="flow">
  <div className="flow-node">Sources dump data into S3 (data lake)</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Glue does ETL + builds the Data Catalog</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">Athena ad hoc query / Redshift warehouse analytics</div>
  <div className="flow-arrow">→</div>
  <div className="flow-node">QuickSight builds dashboards</div>
</div>

*Diagram: centered on S3, data is tidied by Glue, analyzed with Athena or Redshift, and visualized with QuickSight — this chain is the big picture behind most AWS analytics questions.*

## Real-world application: it's not just for the exam

<Scenario title="Real scenario: your manager wants you to find a problem in a pile of S3 logs">

Your system automatically dumps all access logs into S3 every day, and it has piled up to several TB. One day your manager asks: "That anomaly last week — which IPs were behind it? Go check." You **don't want to stand up a database and import the data just to run one query**. The answer: point Athena straight at the logs in S3, run SQL, get your answer, and walk away — paying by the amount scanned. If later you need to produce big revenue reports and complex aggregations every day, that's when it's worth loading the data into a Redshift warehouse and building a daily dashboard in QuickSight for the manager.

</Scenario>

<Cost>

Athena is **billed by the amount of data each query scans**, charges nothing when you don't query, and is cheap to practice with (compressing and partitioning data greatly reduces the scan and therefore the cost). Glue is billed by ETL run time and Data Catalog usage. **A Redshift cluster charges you as long as it's running**, so when you're done practicing, be sure to **delete or pause the cluster**, otherwise it keeps billing. QuickSight is billed per user plan and has a trial allowance. The one that most easily blows up your bill is leaving a Redshift cluster on — remember to shut it down.

</Cost>

:::warning[🚑 Common real-world mistakes]
- **Standing up a database just to query S3 logs once**: for ad hoc queries like this, Athena is the easiest — no database, no servers to manage.
- **Using Redshift as a day-to-day transactional database**: Redshift is analytical (OLAP) and not suited to high-frequency individual transactional writes — that's RDS's job (OLTP).
- **Athena queries with no compression / no partitioning, so costs explode**: billing is by data scanned, and untidy data makes it scan loads of unnecessary data — slow and expensive.
- **Confusing Glue and Athena**: Glue is for **tidying data and building the catalog**, Athena is for **querying data**; they're often used together (Glue builds the catalog, then Athena can query it).
:::

<Refs title="📚 Official docs & further reading">

- [AWS Docs: Amazon Athena User Guide](https://docs.aws.amazon.com/athena/latest/ug/what-is.html)
- [AWS Glue Developer Guide](https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html)
- [Amazon Redshift Management Guide](https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html)
- [Amazon QuickSight User Guide](https://docs.aws.amazon.com/quicksight/latest/user/welcome.html)
- [Building a data lake on AWS](https://docs.aws.amazon.com/whitepapers/latest/building-data-lakes/building-data-lake-aws.html)

</Refs>

## Next

- ⚡ Quick review: [Domain 3 Key Points / Flashcards](/saa/domain-3/flashcards)
- ✍️ Test yourself: [Domain 3 Practice Questions](/saa/domain-3/quiz)
- 📖 Next: [Scalable Network & Storage Patterns](/saa/domain-3/scalability-patterns)
